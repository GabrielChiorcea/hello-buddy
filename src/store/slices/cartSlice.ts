/**
 * Cart slice for Redux store
 * Manages shopping cart items, quantities, and totals
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartState, CartItem, Product, OrderItemConfigurationGroup } from '@/types';
import { DELIVERY_FEE } from '@/config/cart';

// Helper to calculate cart totals
const getUnitPrice = (item: CartItem) =>
  typeof item.unitPriceWithConfiguration === 'number'
    ? item.unitPriceWithConfiguration
    : item.product.price;

const calculateTotals = (items: CartItem[]) => {
  const subtotal = items.reduce(
    (sum, item) => sum + getUnitPrice(item) * item.quantity,
    0
  );
  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  return { subtotal, deliveryFee, total };
};

// Load cart from localStorage
const loadCartFromStorage = (): CartItem[] => {
  try {
    const cartStr = localStorage.getItem('cart');
    if (cartStr) {
      return JSON.parse(cartStr);
    }
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
  }
  return [];
};

// Save cart to localStorage
const saveCartToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem('cart', JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

const initialItems = loadCartFromStorage();
const initialTotals = calculateTotals(initialItems);

const initialState: CartState = {
  items: initialItems,
  subtotal: initialTotals.subtotal,
  deliveryFee: initialTotals.deliveryFee,
  total: initialTotals.total,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (
      state,
      action: PayloadAction<{
        product: Product;
        configuration?: OrderItemConfigurationGroup[];
        unitPriceWithConfiguration?: number;
      }>
    ) => {
      const { product, configuration, unitPriceWithConfiguration } = action.payload;

      const isSameConfiguration = (a?: OrderItemConfigurationGroup[], b?: OrderItemConfigurationGroup[]) => {
        return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
      };

      const existingItem = state.items.find(
        item => item.product.id === product.id && isSameConfiguration(item.configuration, configuration)
      );
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          product,
          quantity: 1,
          configuration,
          unitPriceWithConfiguration,
        });
      }
      
      const totals = calculateTotals(state.items);
      state.subtotal = totals.subtotal;
      state.deliveryFee = totals.deliveryFee;
      state.total = totals.total;
      
      saveCartToStorage(state.items);
    },
    
    removeItem: (
      state,
      action: PayloadAction<{
        productId: string;
        configuration?: OrderItemConfigurationGroup[];
      }>
    ) => {
      const { productId, configuration } = action.payload;
      const isSameConfiguration = (a?: OrderItemConfigurationGroup[], b?: OrderItemConfigurationGroup[]) =>
        JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

      state.items = state.items.filter(
        item =>
          !(
            item.product.id === productId &&
            isSameConfiguration(item.configuration, configuration)
          )
      );
      
      const totals = calculateTotals(state.items);
      state.subtotal = totals.subtotal;
      state.deliveryFee = totals.deliveryFee;
      state.total = totals.total;
      
      saveCartToStorage(state.items);
    },
    
    changeQuantity: (
      state,
      action: PayloadAction<{
        productId: string;
        quantity: number;
        configuration?: OrderItemConfigurationGroup[];
      }>
    ) => {
      const { productId, quantity, configuration } = action.payload;

      const isSameConfiguration = (a?: OrderItemConfigurationGroup[], b?: OrderItemConfigurationGroup[]) =>
        JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

      if (quantity <= 0) {
        state.items = state.items.filter(
          item =>
            !(
              item.product.id === productId &&
              isSameConfiguration(item.configuration, configuration)
            )
        );
      } else {
        const item = state.items.find(
          item =>
            item.product.id === productId &&
            isSameConfiguration(item.configuration, configuration)
        );
        if (item) {
          item.quantity = quantity;
        }
      }
      
      const totals = calculateTotals(state.items);
      state.subtotal = totals.subtotal;
      state.deliveryFee = totals.deliveryFee;
      state.total = totals.total;
      
      saveCartToStorage(state.items);
    },
    
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.deliveryFee = DELIVERY_FEE;
      state.total = DELIVERY_FEE;
      
      localStorage.removeItem('cart');
    },
    
    // Used to sync cart after checkout
    resetCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.deliveryFee = 0;
      state.total = 0;
      
      localStorage.removeItem('cart');
    },
  },
});

export const { addItem, removeItem, changeQuantity, clearCart, resetCart } = cartSlice.actions;
export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartItemCount = (state: { cart: CartState }) => 
  state.cart.items.reduce((count, item) => count + item.quantity, 0);
export const selectCartSubtotal = (state: { cart: CartState }) => state.cart.subtotal;
export const selectCartDeliveryFee = (state: { cart: CartState }) => state.cart.deliveryFee;
export const selectCartTotal = (state: { cart: CartState }) => state.cart.total;
