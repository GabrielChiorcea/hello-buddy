/**
 * =============================================================================
 * REDUX SLICE PENTRU UTILIZATOR ȘI AUTENTIFICARE
 * =============================================================================
 * 
 * SECURITY (OWASP Best Practice):
 * - Access token: DOAR în memorie Redux (protecție XSS)
 * - Refresh token: HttpOnly cookie (gestionat de browser, inaccesibil JS)
 * 
 * La refresh pagină, browserul trimite automat cookie-ul și primim access token nou
 * =============================================================================
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  AuthState, 
  LoginCredentials, 
  SignupData, 
  User, 
  Order, 
  AuthTokens,
  DeliveryAddress
} from '@/types';
import { 
  loginApi, 
  signupApi, 
  logoutApi, 
  fetchOrdersApi,
  fetchAddressesApi
} from '@/api/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// =============================================================================
// STARE INIȚIALĂ - Fără refresh token în localStorage
// =============================================================================

const initialState: AuthState & { 
  orders: Order[]; 
  ordersLoading: boolean;
  addresses: DeliveryAddress[];
  addressesLoading: boolean;
  addressesFetched: boolean;
} = {
  user: null,
  token: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true, // Începe cu loading pentru a verifica sesiunea
  error: null,
  isRefreshing: false,
  orders: [],
  ordersLoading: false,
  addresses: [],
  addressesLoading: false,
  addressesFetched: false,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Restaurare sesiune la încărcarea paginii
 * Browserul trimite automat HttpOnly cookie
 */
export const restoreSession = createAsyncThunk(
  'user/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // IMPORTANT: include cookies
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        return rejectWithValue('Sesiune expirată');
      }
      
      const data = await response.json();
      
      return {
        user: data.user,
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
      };
    } catch (error) {
      return rejectWithValue('Eroare la restaurarea sesiunii');
    }
  }
);

/**
 * Refresh access token în background
 */
export const refreshAccessToken = createAsyncThunk(
  'user/refreshAccessToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        return rejectWithValue('Nu s-a putut reînnoi sesiunea');
      }
      
      const data = await response.json();
      
      return {
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
      };
    } catch (error) {
      return rejectWithValue('Eroare la reîmprospătarea token-ului');
    }
  }
);

/**
 * Autentificare utilizator
 */
export const login = createAsyncThunk(
  'user/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    const response = await loginApi(credentials);
    if (!response.success || !response.data) {
      return rejectWithValue(response.error || 'Autentificare eșuată');
    }
    // Backend setează refresh token în HttpOnly cookie
    return response.data;
  }
);

/**
 * Înregistrare utilizator nou
 */
export const signup = createAsyncThunk(
  'user/signup',
  async (data: SignupData, { rejectWithValue }) => {
    const response = await signupApi(data);
    if (!response.success || !response.data) {
      return rejectWithValue(response.error || 'Înregistrare eșuată');
    }
    // Backend setează refresh token în HttpOnly cookie
    return response.data;
  }
);

/**
 * Deconectare utilizator
 */
export const logout = createAsyncThunk(
  'user/logout',
  async () => {
    await logoutApi();
    // Backend șterge cookie-ul HttpOnly
    return null;
  }
);

/**
 * Obține comenzile utilizatorului
 */
export const fetchOrders = createAsyncThunk(
  'user/fetchOrders',
  async (_: void, { rejectWithValue }) => {
    const response = await fetchOrdersApi();
    if (!response.success || !response.data) {
      return rejectWithValue(response.error || 'Eroare la încărcarea comenzilor');
    }
    return response.data;
  }
);

/**
 * Obține adresele utilizatorului (salvate în Redux pentru Checkout și Profil)
 */
export const fetchAddresses = createAsyncThunk(
  'user/fetchAddresses',
  async (_: void, { rejectWithValue }) => {
    const response = await fetchAddressesApi();
    if (!response.success || !response.data) {
      return rejectWithValue(response.error || 'Eroare la încărcarea adreselor');
    }
    return response.data;
  }
);

// =============================================================================
// SLICE
// =============================================================================

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      // NU salvăm refresh token în localStorage - este în HttpOnly cookie
    },
    
    setIsRefreshing: (state, action: PayloadAction<boolean>) => {
      state.isRefreshing = action.payload;
    },
    
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.orders = [];
      state.addresses = [];
      state.addressesFetched = false;
      state.isRefreshing = false;
      state.isLoading = false;
      // Nu mai este nevoie să ștergem din localStorage
    },
    setAddresses: (state, action: PayloadAction<DeliveryAddress[]>) => {
      state.addresses = action.payload;
    },
    addAddress: (state, action: PayloadAction<DeliveryAddress>) => {
      state.addresses.push(action.payload);
    },
    updateAddress: (state, action: PayloadAction<DeliveryAddress>) => {
      const idx = state.addresses.findIndex((a) => a.id === action.payload.id);
      if (idx >= 0) state.addresses[idx] = action.payload;
    },
    removeAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter((a) => a.id !== action.payload);
    },
    setDefaultAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.map((a) => ({
        ...a,
        isDefault: a.id === action.payload,
      }));
    },
  },
  
  extraReducers: (builder) => {
    // RESTORE SESSION
    builder
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.tokens = {
          accessToken: action.payload.accessToken,
          accessTokenExpiresAt: Date.now() + (action.payload.expiresIn * 1000),
        };
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.tokens = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
    
    // REFRESH ACCESS TOKEN
      .addCase(refreshAccessToken.pending, (state) => {
        state.isRefreshing = true;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.isRefreshing = false;
        if (state.tokens) {
          state.tokens.accessToken = action.payload.accessToken;
          state.tokens.accessTokenExpiresAt = Date.now() + (action.payload.expiresIn * 1000);
        } else {
          state.tokens = {
            accessToken: action.payload.accessToken,
            accessTokenExpiresAt: Date.now() + (action.payload.expiresIn * 1000),
          };
        }
        state.token = action.payload.accessToken;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.isRefreshing = false;
        // Token refresh failed - logout
        state.user = null;
        state.tokens = null;
        state.token = null;
        state.isAuthenticated = false;
      })
    
    // LOGIN
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.token = action.payload.tokens.accessToken;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    
    // SIGNUP
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.token = action.payload.tokens.accessToken;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    
    // LOGOUT
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.orders = [];
        state.addresses = [];
        state.addressesFetched = false;
        state.isRefreshing = false;
      })
    
    // FETCH ORDERS
      .addCase(fetchOrders.pending, (state) => {
        state.ordersLoading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state) => {
        state.ordersLoading = false;
      })
    // FETCH ADDRESSES
      .addCase(fetchAddresses.pending, (state) => {
        state.addressesLoading = true;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addressesLoading = false;
        state.addresses = action.payload;
        state.addressesFetched = true;
      })
      .addCase(fetchAddresses.rejected, (state) => {
        state.addressesLoading = false;
      });
  },
});

// =============================================================================
// EXPORTURI
// =============================================================================

export const { 
  clearError, 
  setUser, 
  setTokens, 
  setIsRefreshing, 
  setIsLoading,
  clearAuth,
  setAddresses,
  addAddress,
  updateAddress,
  removeAddress,
  setDefaultAddress,
} = userSlice.actions;

export default userSlice.reducer;
