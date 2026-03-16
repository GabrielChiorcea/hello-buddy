/**
 * Cart — shared hook & types
 */

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

export interface CartDisplayData {
  items: Array<{ product: any; quantity: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isAuthenticated: boolean;
  orderPreview: OrderPreviewData | null;
  handleRemoveItem: (productId: string, productName: string) => void;
  handleQuantityChange: (productId: string, newQuantity: number) => void;
  handleCheckout: () => void;
}

export function useCartData(): CartDisplayData {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, subtotal, deliveryFee, total } = useAppSelector((s) => s.cart);
  const { isAuthenticated } = useAppSelector((s) => s.user);

  const previewItems = items.map((i) => ({ productId: i.product.id, quantity: i.quantity }));
  const { data: previewData } = useQuery<{ orderPreview: OrderPreviewData }>(GET_ORDER_PREVIEW, {
    variables: { items: previewItems },
    skip: !isAuthenticated || items.length === 0,
    fetchPolicy: 'cache-and-network',
  });
  const orderPreview = previewData?.orderPreview ?? null;

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
    handleRemoveItem,
    handleQuantityChange,
    handleCheckout,
  };
}
