/**
 * Cart slice for Redux store
 * Manages shopping cart items, quantities, and totals
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartState, CartItem, Product } from '@/types';

// Delivery fee threshold for free delivery
const FREE_DELIVERY_THRESHOLD = 75;
const DELIVERY_FEE = 10;

// Helper to calculate cart totals
const calculateTotals = (items: CartItem[]) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
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
    addItem: (state, action: PayloadAction<Product>) => {
      const existingItem = state.items.find(
        item => item.product.id === action.payload.id
      );
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ product: action.payload, quantity: 1 });
      }
      
      const totals = calculateTotals(state.items);
      state.subtotal = totals.subtotal;
      state.deliveryFee = totals.deliveryFee;
      state.total = totals.total;
      
      saveCartToStorage(state.items);
    },
    
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        item => item.product.id !== action.payload
      );
      
      const totals = calculateTotals(state.items);
      state.subtotal = totals.subtotal;
      state.deliveryFee = totals.deliveryFee;
      state.total = totals.total;
      
      saveCartToStorage(state.items);
    },
    
    changeQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        state.items = state.items.filter(
          item => item.product.id !== productId
        );
      } else {
        const item = state.items.find(
          item => item.product.id === productId
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
