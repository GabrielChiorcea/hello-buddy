/**
 * Cart — shared hook & types
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useAppDispatch, useAppSelector } from '@/store';
import { removeItem, changeQuantity } from '@/store/slices/cartSlice';
import type { OrderItemConfigurationGroup } from '@/types';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { toast } from '@/hooks/use-toast';
import { formatDisplayNumber } from '@/lib/utils';
import { DELIVERY_FEE } from '@/config/cart';
import { GET_FREE_DELIVERY_THRESHOLD_SETTING, GET_ORDER_PREVIEW } from '@/graphql/queries';

export interface OrderPreviewData {
  subtotal: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  discountFromFreeProducts: number;
  discountFromPoints: number;
  total: number;
}

export interface FreeProductProgress {
  minOrderValue: number;
  eligibilityThreshold: number;
  currentSubtotal: number;
  remaining: number;
  unlocked: boolean;
  productNames: string[];
}

export interface FreeDeliveryProgress {
  threshold: number;
  current: number;
  remaining: number;
  unlocked: boolean;
  percent: number;
}

export interface CartDisplayData {
  items: Array<{
    product: any;
    quantity: number;
    configuration?: OrderItemConfigurationGroup[];
    unitPriceWithConfiguration?: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isAuthenticated: boolean;
  orderPreview: OrderPreviewData | null;
  freeProductProgress: FreeProductProgress | null;
  freeDeliveryProgress: FreeDeliveryProgress;
  /** Fake countdown seconds remaining (UI only) */
  countdownSeconds: number;
  totalSavings: number;
  /** Computed summary values — single source of truth for all styles */
  summarySubtotal: number;
  summaryDelivery: number;
  summaryDiscountFreeProducts: number;
  summaryDiscountPoints: number;
  summaryTotal: number;
  handleRemoveItem: (productId: string, productName: string, configuration?: OrderItemConfigurationGroup[]) => void;
  handleQuantityChange: (productId: string, newQuantity: number, configuration?: OrderItemConfigurationGroup[]) => void;
  handleCheckout: () => void;
  handleContinueShoppingWithToast: () => void;
}

export const buildCartItemKey = (item: {
  product: { id: string };
  configuration?: OrderItemConfigurationGroup[];
  unitPriceWithConfiguration?: number;
}) => {
  const configKey = (item.configuration ?? [])
    .map((group) => {
      const optionsKey = group.options
        .map((option) => `${option.optionId}:${option.priceDelta ?? 0}`)
        .sort()
        .join('|');
      return `${group.groupId}:${optionsKey}`;
    })
    .sort()
    .join('||');
  const unitPriceKey =
    typeof item.unitPriceWithConfiguration === 'number'
      ? item.unitPriceWithConfiguration.toFixed(2)
      : 'base';
  return `${item.product.id}::${unitPriceKey}::${configKey || 'no-config'}`;
};

export function useCartData(): CartDisplayData {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, subtotal, deliveryFee, total } = useAppSelector((s) => s.cart);
  const { isAuthenticated, user } = useAppSelector((s) => s.user);

  const previewItems = items.map((i) => ({
    productId: i.product.id,
    quantity: i.quantity,
    configuration: i.configuration,
    unitPriceWithConfiguration: i.unitPriceWithConfiguration,
  }));
  const { data: previewData } = useQuery<{ orderPreview: OrderPreviewData }>(GET_ORDER_PREVIEW, {
    variables: { items: previewItems },
    skip: !isAuthenticated || items.length === 0,
    fetchPolicy: 'cache-and-network',
  });
  const orderPreview = previewData?.orderPreview ?? null;
  const { data: deliveryThresholdData } = useQuery<{ free_delivery_threshold: string | null }>(
    GET_FREE_DELIVERY_THRESHOLD_SETTING,
    { fetchPolicy: 'cache-first' }
  );
  const configuredFreeDeliveryThreshold = useMemo(() => {
    const raw = deliveryThresholdData?.free_delivery_threshold;
    const parsed = raw != null ? parseFloat(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [deliveryThresholdData?.free_delivery_threshold]);
  const [lastKnownFreeDeliveryThreshold, setLastKnownFreeDeliveryThreshold] = useState<number | null>(null);
  useEffect(() => {
    const t = orderPreview?.freeDeliveryThreshold;
    if (typeof t === 'number' && t > 0) setLastKnownFreeDeliveryThreshold(t);
  }, [orderPreview?.freeDeliveryThreshold]);
  useEffect(() => {
    if (configuredFreeDeliveryThreshold != null) {
      setLastKnownFreeDeliveryThreshold((prev) => prev ?? configuredFreeDeliveryThreshold);
    }
  }, [configuredFreeDeliveryThreshold]);

  const freeProductProgress = useMemo<FreeProductProgress | null>(() => {
    const campaigns = user?.freeProductCampaignsSummary;
    if (!campaigns || campaigns.length === 0 || items.length === 0) return null;

    let minThreshold = Infinity;
    const freeProductIds = new Set<string>();

    for (const c of campaigns) {
      if (c.minOrderValue > 0 && c.minOrderValue < minThreshold) {
        minThreshold = c.minOrderValue;
      }
      if (c.productDetails) {
        for (const p of c.productDetails) {
          freeProductIds.add(p.id);
        }
      }
    }

    if (minThreshold === Infinity || minThreshold === 0) return null;

    const getItemUnitPrice = (i: (typeof items)[number]) =>
      typeof i.unitPriceWithConfiguration === 'number' ? i.unitPriceWithConfiguration : i.product.price;

    // Calculăm totalul coșului înainte de reduceri.
    let fullSubtotal = 0;
    for (const item of items) {
      fullSubtotal += getItemUnitPrice(item) * item.quantity;
    }
    let cheapestEligiblePrice = Infinity;
    for (const item of items) {
      if (freeProductIds.has(item.product.id)) {
        const unitPrice = getItemUnitPrice(item);
        if (unitPrice < cheapestEligiblePrice) cheapestEligiblePrice = unitPrice;
      }
    }
    const requiredSubtotal =
      cheapestEligiblePrice === Infinity ? minThreshold : minThreshold + cheapestEligiblePrice;
    const remaining = Math.max(0, requiredSubtotal - fullSubtotal);
    // If backend preview is available, it is the source of truth for unlocked state.
    const unlocked = orderPreview
      ? (orderPreview.discountFromFreeProducts ?? 0) > 0
      : fullSubtotal >= requiredSubtotal && Array.from(freeProductIds).some((id) => items.some((i) => i.product.id === id));
    // We want to display only the free *category* names (ex: Pizza),
    // not each individual product name (ex: Pizza Margherita).
    const allCategoryNames = new Set<string>();
    for (const c of campaigns) {
      if (c.categoryName) allCategoryNames.add(c.categoryName);
      if (c.productDetails) {
        for (const p of c.productDetails) {
          if (p.categoryName) allCategoryNames.add(p.categoryName);
        }
      }
    }

    return {
      minOrderValue: minThreshold,
      eligibilityThreshold: requiredSubtotal,
      currentSubtotal: fullSubtotal,
      remaining,
      unlocked,
      // Keep the field name to avoid touching all cart variants.
      // Semantically these are category names now.
      productNames: Array.from(allCategoryNames).slice(0, 3),
    };
  }, [user?.freeProductCampaignsSummary, items, orderPreview]);

  const handleRemoveItem = (productId: string, productName: string, configuration?: OrderItemConfigurationGroup[]) => {
    dispatch(removeItem({ productId, configuration }));
    toast({ title: texts.notifications.removedFromCart, description: productName });
  };

  const handleQuantityChange = (
    productId: string,
    newQuantity: number,
    configuration?: OrderItemConfigurationGroup[]
  ) => {
    dispatch(changeQuantity({ productId, quantity: newQuantity, configuration }));
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Autentificare necesară',
        description: 'Trebuie să te conectezi pentru a finaliza comanda.',
        variant: 'destructive',
      });
      navigate(routes.login, { state: { from: { pathname: routes.checkout } } });
      return;
    }
    navigate(routes.checkout);
  };

  // Free delivery progress
  const freeDeliveryThreshold =
    orderPreview?.freeDeliveryThreshold ??
    lastKnownFreeDeliveryThreshold ??
    configuredFreeDeliveryThreshold;
  const freeDeliveryProgress = useMemo<FreeDeliveryProgress>(() => {
    // Keep progress aligned with backend rule: delivery threshold is checked on subtotal after free-product discount.
    const effectiveSubtotalForDelivery =
      orderPreview
        ? Math.max(0, (orderPreview.subtotal ?? subtotal) - (orderPreview.discountFromFreeProducts ?? 0))
        : subtotal;
    const current = effectiveSubtotalForDelivery;
    const hasThreshold = typeof freeDeliveryThreshold === 'number' && freeDeliveryThreshold > 0;
    const thresholdValue = hasThreshold ? freeDeliveryThreshold : 0;
    const remaining = hasThreshold ? Math.max(0, thresholdValue - current) : 0;
    // Unlock based on amount vs threshold (not on preview deliveryFee), to keep UI behavior tied to sum.
    // If authenticated and threshold is still unknown (no preview yet), keep locked to avoid false positives.
    const thresholdReady = hasThreshold;
    const unlocked =
      isAuthenticated && items.length > 0 && !thresholdReady
        ? false
        : hasThreshold && current >= thresholdValue;
    const percent = hasThreshold ? Math.min(100, (current / thresholdValue) * 100) : 0;

    return { threshold: freeDeliveryThreshold, current, remaining, unlocked, percent };
  }, [subtotal, freeDeliveryThreshold, orderPreview, deliveryFee, isAuthenticated, items.length, lastKnownFreeDeliveryThreshold]);

  // No extra UI-stable state; unlocked visuals are driven directly by freeDeliveryProgress.

  // Fake countdown timer (15 min from mount, UI only)
  const [countdownSeconds, setCountdownSeconds] = useState(15 * 60);
  useEffect(() => {
    if (items.length === 0) return;
    setCountdownSeconds(15 * 60);
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [items.length > 0]); // reset when cart becomes non-empty

  // Total savings
  const totalSavings = useMemo(() => {
    let savings = 0;
    if (orderPreview) {
      if ((orderPreview.deliveryFee ?? deliveryFee) === 0) savings += DELIVERY_FEE;
    } else if (freeDeliveryProgress.unlocked) {
      savings += DELIVERY_FEE;
    }
    if (orderPreview?.discountFromFreeProducts) savings += orderPreview.discountFromFreeProducts;
    if (orderPreview?.discountFromPoints) savings += orderPreview.discountFromPoints;
    return savings;
  }, [freeDeliveryProgress.unlocked, orderPreview, deliveryFee]);

  // Abandon toast on continue shopping
  const handleContinueShoppingWithToast = useCallback(() => {
    if (items.length > 0) {
      toast({
        title: `Ai ${formatDisplayNumber(subtotal, { maximumFractionDigits: 0 })} ${texts.common.currency} în coș`,
        description: 'Nu pierde reducerile — finalizează comanda!',
      });
    }
    navigate(routes.catalog);
  }, [items.length, subtotal, navigate]);

  // Computed summary — single source of truth
  const summarySubtotal = orderPreview?.subtotal ?? subtotal;
  const hasThresholdForFallback = typeof freeDeliveryThreshold === 'number' && freeDeliveryThreshold > 0;
  const fallbackDeliveryFee =
    hasThresholdForFallback && summarySubtotal >= freeDeliveryThreshold
      ? 0
      : DELIVERY_FEE;
  const summaryDelivery = orderPreview?.deliveryFee ?? fallbackDeliveryFee;
  const summaryDiscountFreeProducts = orderPreview?.discountFromFreeProducts ?? 0;
  const summaryDiscountPoints = orderPreview?.discountFromPoints ?? 0;
  const summaryTotal = Math.max(0, summarySubtotal + summaryDelivery - summaryDiscountFreeProducts - summaryDiscountPoints);

  return {
    items,
    subtotal,
    deliveryFee,
    total,
    isAuthenticated,
    orderPreview,
    freeProductProgress,
    freeDeliveryProgress,
    countdownSeconds,
    totalSavings,
    summarySubtotal,
    summaryDelivery,
    summaryDiscountFreeProducts,
    summaryDiscountPoints,
    summaryTotal,
    handleRemoveItem,
    handleQuantityChange,
    handleCheckout,
    handleContinueShoppingWithToast,
  };
}
