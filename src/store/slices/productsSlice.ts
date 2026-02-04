/**
 * Products slice for Redux store
 * Manages product listing, filtering, and search
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product, Category } from '@/types';
import { fetchProductsApi, fetchCategoriesApi, searchProductsApi } from '@/api/api';

interface ProductsState {
  items: Product[];
  filteredItems: Product[];
  categories: Category[];
  selectedCategory: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  filteredItems: [],
  categories: [],
  selectedCategory: null,
  searchQuery: '',
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    const response = await fetchProductsApi();
    if (!response.success || !response.data) {
      return rejectWithValue(response.error || 'Failed to fetch products');
    }
    return response.data;
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    const response = await fetchCategoriesApi();
    if (!response.success || !response.data) {
      return rejectWithValue(response.error || 'Failed to fetch categories');
    }
    return response.data;
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (query: string, { rejectWithValue }) => {
    const response = await searchProductsApi(query);
    if (!response.success || !response.data) {
      return rejectWithValue(response.error || 'Search failed');
    }
    return response.data;
  }
);

// Helper to filter products - folosește categoryId pentru filtrare corectă
const filterProducts = (
  items: Product[],
  categoryName: string | null, // Acesta e category.name (slug) din categories
  searchQuery: string,
  categories: Category[]
): Product[] => {
  let filtered = items;
  
  if (categoryName) {
    // Găsește categoria după name (slug)
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      // Filtrează după categoryId dacă există, altfel după category (display name)
      filtered = filtered.filter((p) => {
        if (p.categoryId) {
          return p.categoryId === category.id;
        }
        // Fallback: compară cu display name
        const productCat = (p.category || '').trim().toLowerCase();
        return productCat === category.displayName.toLowerCase() || productCat === category.name.toLowerCase();
      });
    }
  }
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query)
    );
  }
  
  return filtered;
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
      state.filteredItems = filterProducts(
        state.items,
        action.payload,
        state.searchQuery,
        state.categories
      );
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filteredItems = filterProducts(
        state.items,
        state.selectedCategory,
        action.payload,
        state.categories
      );
    },
    
    clearFilters: (state) => {
      state.selectedCategory = null;
      state.searchQuery = '';
      state.filteredItems = state.items;
    },
  },
  extraReducers: (builder) => {
    // Fetch Products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.filteredItems = filterProducts(
          action.payload,
          state.selectedCategory,
          state.searchQuery,
          state.categories
        );
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    
    // Fetch Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        // Re-filter produsele când se încarcă categoriile
        state.filteredItems = filterProducts(
          state.items,
          state.selectedCategory,
          state.searchQuery,
          action.payload
        );
      })
    
    // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.filteredItems = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedCategory, setSearchQuery, clearFilters } = productsSlice.actions;
export default productsSlice.reducer;

// Selectors
export const selectAllProducts = (state: { products: ProductsState }) => state.products.items;
export const selectFilteredProducts = (state: { products: ProductsState }) => state.products.filteredItems;
export const selectCategories = (state: { products: ProductsState }) => state.products.categories;
export const selectSelectedCategory = (state: { products: ProductsState }) => state.products.selectedCategory;
export const selectSearchQuery = (state: { products: ProductsState }) => state.products.searchQuery;
export const selectProductsLoading = (state: { products: ProductsState }) => state.products.isLoading;
