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
  handleRemoveItem: (productId: string, productName: string, configuration?: OrderItemConfigurationGroup[]) => void;
  handleQuantityChange: (productId: string, newQuantity: number, configuration?: OrderItemConfigurationGroup[]) => void;
  handleCheckout: () => void;
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

    // Excludem produsele eligibile pentru gratuitate din paidSubtotal
    // pentru a evita logica circulară la verificarea pragului
    let paidSubtotal = 0;
    for (const item of items) {
      if (freeProductIds.has(item.product.id)) continue;
      paidSubtotal += getItemUnitPrice(item) * item.quantity;
    }

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


  return {
    items,
    subtotal,
    deliveryFee,
    total,
    isAuthenticated,
    orderPreview,
    freeProductProgress,
    handleRemoveItem,
    handleQuantityChange,
    handleCheckout,
  };
}
