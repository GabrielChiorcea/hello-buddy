/**
 * =============================================================================
 * HOOK-URI APOLLO PENTRU COMENZI
 * =============================================================================
 * 
 * Backend-ul folosește JWT context pentru userId - nu mai trebuie transmis.
 * =============================================================================
 */

import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_ORDERS, GET_ORDER_BY_ID } from '../queries';
import { CREATE_ORDER, CANCEL_ORDER } from '../mutations';
import { Order, CartItem, PaymentMethod } from '@/types';
import { useCallback } from 'react';

// ============================================================================
// INTERFEȚE
// ============================================================================

interface OrdersData {
  orders: Order[];
}

interface OrderData {
  order: Order | null;
}

interface CreateOrderInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  deliveryAddress: string;
  deliveryCity: string;
  phone: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

// ============================================================================
// HOOK-URI
// ============================================================================

/**
 * Hook pentru obținerea comenzilor - folosește JWT context
 */
export const useUserOrders = () => {
  const { data, loading, error, refetch } = useQuery<OrdersData>(
    GET_USER_ORDERS,
    {
      fetchPolicy: 'cache-and-network',
    }
  );
  
  return {
    orders: data?.orders || [],
    loading,
    error: error?.message || null,
    refetch,
  };
};

export const useOrder = (id: string) => {
  const { data, loading, error } = useQuery<OrderData>(GET_ORDER_BY_ID, {
    variables: { id },
    skip: !id,
  });
  
  return {
    order: data?.order || null,
    loading,
    error: error?.message || null,
  };
};

export const useCreateOrder = () => {
  const [mutation, { loading, error }] = useMutation<{ createOrder: Order }>(
    CREATE_ORDER,
    {
      refetchQueries: [{ query: GET_USER_ORDERS }],
    }
  );
  
  const createOrder = useCallback(async (
    cartItems: CartItem[],
    deliveryAddress: string,
    deliveryCity: string,
    phone: string,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => {
    try {
      const input: CreateOrderInput = {
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        deliveryAddress,
        deliveryCity,
        phone,
        notes: notes || undefined,
        paymentMethod,
      };
      
      const { data } = await mutation({ variables: { input } });
      
      if (data?.createOrder) {
        return { success: true, order: data.createOrder };
      }
      
      return { success: false, error: 'Nu s-a putut plasa comanda' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nu s-a putut plasa comanda';
      console.error('Eroare la plasarea comenzii:', message);
      return { success: false, error: message };
    }
  }, [mutation]);
  
  return {
    createOrder,
    loading,
    error: error?.message || null,
  };
};

export const useCancelOrder = () => {
  const [mutation, { loading, error }] = useMutation<{ cancelOrder: Order }>(
    CANCEL_ORDER,
    {
      refetchQueries: [{ query: GET_USER_ORDERS }],
    }
  );
  
  const cancelOrder = useCallback(async (id: string) => {
    try {
      const { data } = await mutation({ variables: { id } });
      
      if (data?.cancelOrder) {
        return { success: true, order: data.cancelOrder };
      }
      
      return { success: false, error: 'Nu s-a putut anula comanda' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nu s-a putut anula comanda';
      console.error('Eroare la anularea comenzii:', message);
      return { success: false, error: message };
    }
  }, [mutation]);
  
  return {
    cancelOrder,
    loading,
    error: error?.message || null,
  };
};
