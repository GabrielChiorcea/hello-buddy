/**
 * Products slice for Redux store
 * Manages product listing and category filtering
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product, Category } from '@/types';
import {
  fetchProductsApi,
  fetchCategoriesApi,
  fetchRecommendedProductsApi,
  fetchAppStatsApi,
} from '@/api/api';
import { apolloClient } from '@/graphql/client';
import { GET_MY_COUPONS } from '@/graphql/queries';

interface ProductsState {
  items: Product[];
  filteredItems: Product[];
  categories: Category[];
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;
  recommendedProducts: Product[];
  totalProducts: number;
  activeCouponDiscountByProductId: Record<string, number>;
  activeCouponDiscountsLoading: boolean;
  activeCouponDiscountsError: string | null;
  activeCouponDiscountsLoadedAt: number | null;
}

const initialState: ProductsState = {
  items: [],
  filteredItems: [],
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,
  recommendedProducts: [],
  totalProducts: 0,
  activeCouponDiscountByProductId: {},
  activeCouponDiscountsLoading: false,
  activeCouponDiscountsError: null,
  activeCouponDiscountsLoadedAt: null,
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

export const fetchRecommendedProducts = createAsyncThunk(
  'products/fetchRecommendedProducts',
  async (_, { rejectWithValue }) => {
    const response = await fetchRecommendedProductsApi();
    if (!response.success || !response.data) {
      return rejectWithValue(response.error || 'Failed to fetch recommended products');
    }
    return response.data;
  }
);

export const fetchAppStats = createAsyncThunk(
  'products/fetchAppStats',
  async (_, { rejectWithValue }) => {
    const response = await fetchAppStatsApi();
    if (!response.success || !response.data) {
      return rejectWithValue(response.error || 'Failed to fetch app stats');
    }
    return response.data.totalProducts;
  }
);

interface MyCouponsQueryData {
  myCoupons: Array<{
    status: 'active' | 'used' | 'expired';
    coupon: {
      targetProductId?: string | null;
      discountPercent: number;
    };
  }>;
}

export const fetchActiveCouponDiscounts = createAsyncThunk(
  'products/fetchActiveCouponDiscounts',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apolloClient.query<MyCouponsQueryData>({
        query: GET_MY_COUPONS,
        fetchPolicy: 'network-only',
      });
      const discountsByProduct: Record<string, number> = {};
      for (const entry of data?.myCoupons ?? []) {
        if (entry.status !== 'active') continue;
        const productId = entry.coupon?.targetProductId;
        if (!productId) continue;
        const discount = Number(entry.coupon?.discountPercent ?? 0);
        if (!Number.isFinite(discount) || discount <= 0) continue;
        discountsByProduct[productId] = Math.max(discountsByProduct[productId] ?? 0, discount);
      }
      return discountsByProduct;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch active coupon discounts';
      return rejectWithValue(message);
    }
  }
);

// Helper to filter products - folosește categoryId pentru filtrare corectă
const filterProducts = (
  items: Product[],
  categoryName: string | null, // Acesta e category.name (slug) din categories
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

  return filtered;
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
      state.filteredItems = filterProducts(state.items, action.payload, state.categories);
    },

    clearFilters: (state) => {
      state.selectedCategory = null;
      state.filteredItems = state.items;
    },
    clearActiveCouponDiscounts: (state) => {
      state.activeCouponDiscountByProductId = {};
      state.activeCouponDiscountsLoading = false;
      state.activeCouponDiscountsError = null;
      state.activeCouponDiscountsLoadedAt = null;
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
        state.filteredItems = filterProducts(action.payload, state.selectedCategory, state.categories);
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
          action.payload
        );
      })

      // Recommended products
      .addCase(fetchRecommendedProducts.fulfilled, (state, action) => {
        state.recommendedProducts = action.payload;
      })
      // App stats (total products)
      .addCase(fetchAppStats.fulfilled, (state, action) => {
        state.totalProducts = action.payload;
      })
      // Active coupon discounts map
      .addCase(fetchActiveCouponDiscounts.pending, (state) => {
        state.activeCouponDiscountsLoading = true;
        state.activeCouponDiscountsError = null;
      })
      .addCase(fetchActiveCouponDiscounts.fulfilled, (state, action) => {
        state.activeCouponDiscountsLoading = false;
        state.activeCouponDiscountByProductId = action.payload;
        state.activeCouponDiscountsLoadedAt = Date.now();
      })
      .addCase(fetchActiveCouponDiscounts.rejected, (state, action) => {
        state.activeCouponDiscountsLoading = false;
        state.activeCouponDiscountsError = (action.payload as string) || 'Failed to load coupon discounts';
      });
  },
});

export const { setSelectedCategory, clearFilters, clearActiveCouponDiscounts } = productsSlice.actions;
export default productsSlice.reducer;

// Selectors
export const selectAllProducts = (state: { products: ProductsState }) => state.products.items;
export const selectFilteredProducts = (state: { products: ProductsState }) => state.products.filteredItems;
export const selectCategories = (state: { products: ProductsState }) => state.products.categories;
export const selectSelectedCategory = (state: { products: ProductsState }) => state.products.selectedCategory;
export const selectProductsLoading = (state: { products: ProductsState }) => state.products.isLoading;
export const selectRecommendedProducts = (state: { products: ProductsState }) => state.products.recommendedProducts;
export const selectTotalProducts = (state: { products: ProductsState }) => state.products.totalProducts;
export const selectActiveCouponDiscountByProductId = (state: { products: ProductsState }) =>
  state.products.activeCouponDiscountByProductId;
export const selectActiveCouponDiscountForProduct = (
  state: { products: ProductsState },
  productId: string
) => state.products.activeCouponDiscountByProductId[productId] ?? 0;
export const selectActiveCouponDiscountsLoading = (state: { products: ProductsState }) =>
  state.products.activeCouponDiscountsLoading;
export const selectActiveCouponDiscountsLoadedAt = (state: { products: ProductsState }) =>
  state.products.activeCouponDiscountsLoadedAt;
