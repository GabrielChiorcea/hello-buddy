/**
 * Teste pentru componenta ProductCard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ProductCard } from '@/components/common/ProductCard';
import cartReducer from '@/store/slices/cartSlice';
import { Product } from '@/types';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Produs test
const mockProduct: Product = {
  id: 'prod-1',
  name: 'Pizza Margherita',
  description: 'Sos de roșii, mozzarella, busuioc proaspăt',
  price: 32,
  category: 'pizza',
  image: '/placeholder.svg',
  isAvailable: true,
  preparationTime: 20,
  ingredients: [
    { name: 'sos roșii', isAllergen: false },
    { name: 'mozzarella', isAllergen: true },
  ],
};

const createTestStore = () =>
  configureStore({
    reducer: {
      cart: cartReducer,
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore();
  return {
    store,
    ...render(
      <Provider store={store}>
        <BrowserRouter>{component}</BrowserRouter>
      </Provider>
    ),
  };
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('afișează corect numele produsului', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
  });

  it('afișează corect prețul', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/32/)).toBeInTheDocument();
  });

  it('afișează descrierea produsului', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/Sos de roșii, mozzarella, busuioc proaspăt/)).toBeInTheDocument();
  });

  it('afișează categoria produsului', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Pizza')).toBeInTheDocument();
  });

  it('afișează timpul de preparare', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/20 min/)).toBeInTheDocument();
  });

  it('butonul "Adaugă în coș" adaugă produsul în coș', () => {
    const { store } = renderWithProviders(<ProductCard product={mockProduct} />);
    
    const addButton = screen.getByRole('button', { name: /adaugă/i });
    fireEvent.click(addButton);
    
    const state = store.getState();
    expect(state.cart.items).toHaveLength(1);
    expect(state.cart.items[0].product.id).toBe('prod-1');
    expect(state.cart.items[0].quantity).toBe(1);
  });

  it('afișează mesaj "Indisponibil" pentru produse indisponibile', () => {
    const unavailableProduct = { ...mockProduct, isAvailable: false };
    renderWithProviders(<ProductCard product={unavailableProduct} />);
    
    expect(screen.getByText('Indisponibil')).toBeInTheDocument();
  });

  it('butonul de adăugare este dezactivat pentru produse indisponibile', () => {
    const unavailableProduct = { ...mockProduct, isAvailable: false };
    renderWithProviders(<ProductCard product={unavailableProduct} />);
    
    const addButton = screen.getByRole('button', { name: /adaugă/i });
    expect(addButton).toBeDisabled();
  });

  it('link-ul navighează la pagina produsului', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    const link = screen.getByRole('link');
    // Route is /product/:id (English)
    expect(link).toHaveAttribute('href', '/product/prod-1');
  });

  it('nu afișează link când disableLink este true', () => {
    renderWithProviders(<ProductCard product={mockProduct} disableLink />);
    
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('afișează check după adăugare în coș', async () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    const addButton = screen.getByRole('button', { name: /adaugă/i });
    fireEvent.click(addButton);
    
    // După click, butonul ar trebui să afișeze "Adăugat!"
    expect(await screen.findByText(/adăugat/i)).toBeInTheDocument();
  });
});
