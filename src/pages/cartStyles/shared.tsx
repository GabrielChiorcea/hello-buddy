/**
 * Cart — shared hook & types
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useAppDispatch, useAppSelector } from '@/store';
import { removeItem, changeQuantity } from '@/store/slices/cartSlice';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { toast } from '@/hooks/use-toast';
import { FREE_DELIVERY_THRESHOLD } from '@/config/cart';
import { GET_ORDER_PREVIEW } from '@/graphql/queries';

export { FREE_DELIVERY_THRESHOLD };

export interface OrderPreviewData {
  subtotal: number;
  deliveryFee: number;
  discountFromFreeProducts: number;
  discountFromPoints: number;
  total: number;
}

export interface FreeProductProgress {
  /** Cel mai mic prag minim activ din campaniile userului */
  minOrderValue: number;
  /** Subtotalul produselor plătite (fără cele gratuite) */
  paidSubtotal: number;
  /** Cât mai trebuie adăugat */
  remaining: number;
  /** Dacă pragul a fost atins */
  unlocked: boolean;
  /** Numele produselor gratuite disponibile */
  productNames: string[];
}

export interface CartDisplayData {
  items: Array<{ product: any; quantity: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isAuthenticated: boolean;
  orderPreview: OrderPreviewData | null;
  freeProductProgress: FreeProductProgress | null;
  handleRemoveItem: (productId: string, productName: string) => void;
  handleQuantityChange: (productId: string, newQuantity: number) => void;
  handleCheckout: () => void;
}

export function useCartData(): CartDisplayData {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, subtotal, deliveryFee, total } = useAppSelector((s) => s.cart);
  const { isAuthenticated, user } = useAppSelector((s) => s.user);

  const previewItems = items.map((i) => ({ productId: i.product.id, quantity: i.quantity }));
  const { data: previewData } = useQuery<{ orderPreview: OrderPreviewData }>(GET_ORDER_PREVIEW, {
    variables: { items: previewItems },
    skip: !isAuthenticated || items.length === 0,
    fetchPolicy: 'cache-and-network',
  });
  const orderPreview = previewData?.orderPreview ?? null;

  // Calculăm progresul spre produse gratuite
  const freeProductProgress = useMemo<FreeProductProgress | null>(() => {
    const campaigns = user?.freeProductCampaignsSummary;
    if (!campaigns || campaigns.length === 0 || items.length === 0) return null;

    // Găsim cel mai mic minOrderValue > 0 din campaniile active
    let minThreshold = Infinity;
    const allProductNames: string[] = [];
    const freeProductIds = new Set<string>();

    for (const c of campaigns) {
      if (c.minOrderValue > 0 && c.minOrderValue < minThreshold) {
        minThreshold = c.minOrderValue;
      }
      allProductNames.push(...c.products);
      if (c.productDetails) {
        for (const p of c.productDetails) {
          freeProductIds.add(p.id);
        }
      }
    }

    if (minThreshold === Infinity || minThreshold === 0) return null;

    // Calculăm subtotalul plătit (excluzând produsele gratuite din coș)
    let paidSubtotal = 0;
    for (const item of items) {
      if (freeProductIds.has(item.product.id)) {
        // Max 1 gratuit, restul plătit
        const paidQty = item.quantity > 1 ? item.quantity - 1 : 0;
        paidSubtotal += item.product.price * paidQty;
      } else {
        paidSubtotal += item.product.price * item.quantity;
      }
    }

    const remaining = Math.max(0, minThreshold - paidSubtotal);
    const unlocked = paidSubtotal >= minThreshold;

    return {
      minOrderValue: minThreshold,
      paidSubtotal,
      remaining,
      unlocked,
      productNames: [...new Set(allProductNames)].slice(0, 3),
    };
  }, [user?.freeProductCampaignsSummary, items]);

  const handleRemoveItem = (productId: string, productName: string) => {
    dispatch(removeItem(productId));
    toast({ title: texts.notifications.removedFromCart, description: productName });
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    dispatch(changeQuantity({ productId, quantity: newQuantity }));
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
