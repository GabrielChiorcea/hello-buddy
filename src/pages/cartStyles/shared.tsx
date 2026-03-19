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
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '@/config/cart';
import { GET_ORDER_PREVIEW } from '@/graphql/queries';

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
  paidSubtotal: number;
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
  handleRemoveItem: (productId: string, productName: string, configuration?: OrderItemConfigurationGroup[]) => void;
  handleQuantityChange: (productId: string, newQuantity: number, configuration?: OrderItemConfigurationGroup[]) => void;
  handleCheckout: () => void;
  handleContinueShoppingWithToast: () => void;
}

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

    // Calculăm totalul TUTUROR produselor din coș
    let fullSubtotal = 0;
    for (const item of items) {
      fullSubtotal += getItemUnitPrice(item) * item.quantity;
    }

    // Scădem doar prețul UNUI singur produs gratuit (cel mai ieftin eligibil)
    // pentru a evita logica circulară, dar fără a exclude toate produsele din categorie
    let cheapestFreePrice = Infinity;
    for (const item of items) {
      if (freeProductIds.has(item.product.id)) {
        const unitPrice = getItemUnitPrice(item);
        if (unitPrice < cheapestFreePrice) cheapestFreePrice = unitPrice;
      }
    }
    const freeDeduction = cheapestFreePrice === Infinity ? 0 : cheapestFreePrice;
    const paidSubtotal = fullSubtotal - freeDeduction;

    const remaining = Math.max(0, minThreshold - paidSubtotal);
    const unlocked = paidSubtotal >= minThreshold;
    const allNames: string[] = [];
    for (const c of campaigns) {
      allNames.push(...c.products);
    }

    return {
      minOrderValue: minThreshold,
      paidSubtotal,
      remaining,
      unlocked,
      productNames: [...new Set(allNames)].slice(0, 3),
    };
  }, [user?.freeProductCampaignsSummary, items]);

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
  const freeDeliveryThreshold = orderPreview?.freeDeliveryThreshold ?? FREE_DELIVERY_THRESHOLD;
  const freeDeliveryProgress = useMemo<FreeDeliveryProgress>(() => {
    const current = subtotal;
    const remaining = Math.max(0, freeDeliveryThreshold - current);
    const unlocked = current >= freeDeliveryThreshold;
    const percent = Math.min(100, (current / freeDeliveryThreshold) * 100);
    return { threshold: freeDeliveryThreshold, current, remaining, unlocked, percent };
  }, [subtotal, freeDeliveryThreshold]);

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
    if (freeDeliveryProgress.unlocked) savings += DELIVERY_FEE;
    if (orderPreview?.discountFromFreeProducts) savings += orderPreview.discountFromFreeProducts;
    if (orderPreview?.discountFromPoints) savings += orderPreview.discountFromPoints;
    if (!orderPreview && freeProductProgress?.unlocked) {
      // Fallback: estimate free product savings from local data
      savings += freeProductProgress.paidSubtotal - freeProductProgress.minOrderValue > 0 ? 0 : 0;
    }
    return savings;
  }, [freeDeliveryProgress.unlocked, orderPreview, freeProductProgress]);

  // Abandon toast on continue shopping
  const handleContinueShoppingWithToast = useCallback(() => {
    if (items.length > 0) {
      toast({
        title: `Ai ${subtotal.toFixed(0)} ${texts.common.currency} în coș`,
        description: 'Nu pierde reducerile — finalizează comanda!',
      });
    }
    navigate(routes.catalog);
  }, [items.length, subtotal, navigate]);

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
    handleRemoveItem,
    handleQuantityChange,
    handleCheckout,
    handleContinueShoppingWithToast,
  };
}
