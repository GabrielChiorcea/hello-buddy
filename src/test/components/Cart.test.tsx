/**
 * Teste pentru pagina Cart
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Cart from '@/pages/Cart';
import cartReducer, { addItem } from '@/store/slices/cartSlice';
import userReducer from '@/store/slices/userSlice';
import { Product, CartItem } from '@/types';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

const createTestStore = () => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      user: userReducer,
    },
  });
};

const renderCart = (products: Product[] = []) => {
  const store = createTestStore();
  
  // Add products to cart
  products.forEach(product => {
    store.dispatch(addItem({ product }));
  });
  
  return {
    store,
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    ),
  };
};

describe('Cart - Coș gol', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('afișează mesaj când coșul este gol', () => {
    renderCart([]);
    
    // texts.cart.empty = 'Coșul tău este gol'
    expect(screen.getByText(/coșul tău este gol/i)).toBeInTheDocument();
  });

  it('afișează buton pentru a continua cumpărăturile', () => {
    renderCart([]);
    
    // texts.cart.continueShopping = 'Continuă cumpărăturile'
    expect(screen.getByRole('link', { name: /continuă cumpărăturile/i })).toBeInTheDocument();
  });

  it('link-ul duce la catalog', () => {
    renderCart([]);
    
    const link = screen.getByRole('link', { name: /continuă cumpărăturile/i });
    expect(link).toHaveAttribute('href', '/catalog');
  });
});

describe('Cart - Cu produse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('afișează produsele din coș', () => {
    renderCart([productA, productB]);
    
    expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    expect(screen.getByText('Burger Classic')).toBeInTheDocument();
  });

  it('calculează corect subtotal-ul', () => {
    // Add productA twice and productB once = 32 + 32 + 28 = 92
    const store = createTestStore();
    store.dispatch(addItem({ product: productA }));
    store.dispatch(addItem({ product: productA }));
    store.dispatch(addItem({ product: productB }));
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    );
    
    // Subtotal = 92, should appear somewhere
    expect(screen.getAllByText(/92/).length).toBeGreaterThan(0);
  });

  it('afișează taxa de livrare gratuită pentru comenzi peste 75 RON', () => {
    // 32 * 3 = 96 RON
    const store = createTestStore();
    store.dispatch(addItem({ product: productA }));
    store.dispatch(addItem({ product: productA }));
    store.dispatch(addItem({ product: productA }));
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    );
    
    // texts.cart.freeDelivery = 'Livrare gratuită'
    expect(screen.getByText(/livrare gratuită/i)).toBeInTheDocument();
  });

  it('afișează taxa de livrare pentru comenzi sub 75 RON', () => {
    renderCart([productA]); // 32 RON
    
    // Taxa de livrare 10 RON - cautam "10 RON" specific
    expect(screen.getByText(/10 RON/)).toBeInTheDocument();
  });

  it('afișează mesaj despre livrare gratuită când nu e atins pragul', () => {
    renderCart([productA]); // 32 RON
    
    expect(screen.getByText(/livrare gratuită pentru comenzi de peste 75/i)).toBeInTheDocument();
  });
});

describe('Cart - Checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('butonul checkout există', () => {
    renderCart([productA]);
    
    // texts.cart.checkout = 'Finalizează comanda'
    expect(screen.getByRole('button', { name: /finalizează comanda/i })).toBeInTheDocument();
  });
});

describe('Cart - Calcule totale', () => {
  it('calculează corect totalul sub pragul livrării gratuite', () => {
    // 32 RON produs + 10 RON livrare = 42 RON
    renderCart([productA]);
    
    // Total 42 appears
    expect(screen.getAllByText(/42/).length).toBeGreaterThan(0);
  });

  it('calculează corect totalul peste pragul livrării gratuite', () => {
    // 32 * 3 = 96 RON + 0 livrare = 96 RON
    const store = createTestStore();
    store.dispatch(addItem({ product: productA }));
    store.dispatch(addItem({ product: productA }));
    store.dispatch(addItem({ product: productA }));
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Cart />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getAllByText(/96/).length).toBeGreaterThan(0);
  });
});
