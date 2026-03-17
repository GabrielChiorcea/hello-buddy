/**
 * Teste pentru cartSlice - gestionarea coșului de cumpărături
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer, {
  addItem,
  removeItem,
  changeQuantity,
  clearCart,
  resetCart,
  selectCartItemCount,
  selectCartTotal,
} from '@/store/slices/cartSlice';
import { Product } from '@/types';

// Produse test
const productA: Product = {
  id: 'prod-a',
  name: 'Pizza Margherita',
  description: 'Pizza clasică',
  price: 32,
  category: 'pizza',
  image: '/pizza.jpg',
  isAvailable: true,
};

const productB: Product = {
  id: 'prod-b',
  name: 'Burger Classic',
  description: 'Burger de vită',
  price: 28,
  category: 'burger',
  image: '/burger.jpg',
  isAvailable: true,
};

const createStore = () =>
  configureStore({
    reducer: { cart: cartReducer },
  });

describe('cartSlice', () => {
  describe('addItem', () => {
    it('adaugă un produs nou în coș', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      
      const state = store.getState().cart;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].product.id).toBe('prod-a');
      expect(state.items[0].quantity).toBe(1);
    });

    it('incrementează cantitatea pentru produs existent', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      store.dispatch(addItem({ product: productA }));
      
      const state = store.getState().cart;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
    });

    it('calculează corect subtotal-ul', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      store.dispatch(addItem({ product: productB }));
      
      const state = store.getState().cart;
      expect(state.subtotal).toBe(60); // 32 + 28
    });

    it('taxa de livrare devine 0 peste 75 RON', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA })); // 32
      store.dispatch(addItem({ product: productA })); // 64
      expect(store.getState().cart.deliveryFee).toBe(10);
      
      store.dispatch(addItem({ product: productB })); // 92
      expect(store.getState().cart.deliveryFee).toBe(0);
    });

    it('calculează corect totalul', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      
      const state = store.getState().cart;
      expect(state.subtotal).toBe(32);
      expect(state.deliveryFee).toBe(10);
      expect(state.total).toBe(42);
    });
  });

  describe('removeItem', () => {
    it('elimină produsul din coș', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      store.dispatch(addItem({ product: productA }));
      store.dispatch(addItem({ product: productB }));
      
      store.dispatch(removeItem('prod-a'));
      
      const state = store.getState().cart;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].product.id).toBe('prod-b');
    });

    it('recalculează totalele după eliminare', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      store.dispatch(addItem({ product: productA }));
      store.dispatch(addItem({ product: productB })); // 92 RON total
      
      store.dispatch(removeItem('prod-a')); // Rămân 28 RON
      
      const state = store.getState().cart;
      expect(state.subtotal).toBe(28);
      expect(state.deliveryFee).toBe(10); // Sub 75 RON
      expect(state.total).toBe(38);
    });
  });

  describe('changeQuantity', () => {
    it('modifică cantitatea produsului', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      store.dispatch(changeQuantity({ productId: 'prod-a', quantity: 3 }));
      
      const state = store.getState().cart;
      expect(state.items[0].quantity).toBe(3);
      expect(state.subtotal).toBe(96);
    });

    it('elimină produsul când cantitatea devine 0', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      store.dispatch(changeQuantity({ productId: 'prod-a', quantity: 0 }));
      
      const state = store.getState().cart;
      expect(state.items).toHaveLength(0);
    });

    it('elimină produsul când cantitatea devine negativă', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      store.dispatch(changeQuantity({ productId: 'prod-a', quantity: -1 }));
      
      const state = store.getState().cart;
      expect(state.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('golește coșul', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      store.dispatch(addItem({ product: productB }));
      store.dispatch(clearCart());
      
      const state = store.getState().cart;
      expect(state.items).toHaveLength(0);
      expect(state.subtotal).toBe(0);
      expect(state.deliveryFee).toBe(10);
      expect(state.total).toBe(10);
    });
  });

  describe('resetCart', () => {
    it('resetează complet coșul (după checkout)', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      store.dispatch(addItem({ product: productA }));
      store.dispatch(resetCart());
      
      const state = store.getState().cart;
      expect(state.items).toHaveLength(0);
      expect(state.subtotal).toBe(0);
      expect(state.deliveryFee).toBe(0);
      expect(state.total).toBe(0);
    });
  });

  describe('selectori', () => {
    it('selectCartItemCount returnează numărul total de articole', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      store.dispatch(addItem({ product: productA }));
      store.dispatch(addItem({ product: productB }));
      store.dispatch(addItem({ product: productB }));
      store.dispatch(addItem({ product: productB }));
      
      expect(selectCartItemCount(store.getState())).toBe(5);
    });

    it('selectCartTotal returnează totalul', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA }));
      store.dispatch(addItem({ product: productA }));
      
      expect(selectCartTotal(store.getState())).toBe(74); // 64 + 10 delivery
    });
  });

  describe('calcul livrare gratuită', () => {
    it('livrare 10 RON pentru comenzi sub 75 RON', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA })); // 32 RON
      expect(store.getState().cart.deliveryFee).toBe(10);
    });

    it('livrare gratuită pentru comenzi de 75+ RON', () => {
      const store = createStore();
      store.dispatch(addItem({ product: productA })); // 32
      store.dispatch(addItem({ product: productA })); // 64
      store.dispatch(addItem({ product: productA })); // 96
      
      expect(store.getState().cart.subtotal).toBe(96);
      expect(store.getState().cart.deliveryFee).toBe(0);
    });

    it('livrare gratuită exact la 75 RON', () => {
      const product75: Product = {
        id: 'prod-75',
        name: 'Produs 75',
        description: 'Produs test',
        price: 75,
        category: 'test',
        image: '/test.jpg',
        isAvailable: true,
      };
      
      const store = createStore();
      store.dispatch(addItem({ product: product75 }));
      expect(store.getState().cart.deliveryFee).toBe(0);
    });
  });
});
