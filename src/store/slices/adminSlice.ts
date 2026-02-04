/**
 * =============================================================================
 * REDUX SLICE PENTRU PANOUL DE ADMINISTRARE
 * =============================================================================
 * SECURITY: Refresh token în HttpOnly cookie (gestionat de browser)
 * Access token doar în memorie Redux
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AdminAuthState, AdminUser, AdminLoginCredentials } from '@/types/admin';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// =============================================================================
// STARE INIȚIALĂ
// =============================================================================

const initialState: AdminAuthState & { 
  tokenExpiresAt: number;
  newOrdersCount: number;
} = {
  admin: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Începem cu loading pentru a verifica sesiunea
  error: null,
  tokenExpiresAt: 0,
  newOrdersCount: 0,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Autentificare admin
 * Backend setează refresh token în HttpOnly cookie
 */
export const adminLogin = createAsyncThunk(
  'admin/login',
  async (credentials: AdminLoginCredentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // IMPORTANT: include cookies
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Autentificare eșuată');
      }
      
      const data = await response.json();
      
      return {
        admin: data.user,
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
      };
    } catch (error) {
      return rejectWithValue('Eroare de conexiune la server');
    }
  }
);

/**
 * Refresh token admin - bazat pe HttpOnly cookie
 * Browserul trimite automat cookie-ul
 */
export const adminRefreshToken = createAsyncThunk(
  'admin/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/admin/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // IMPORTANT: include cookies
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        return rejectWithValue('Sesiune expirată');
      }
      
      const data = await response.json();
      
      return {
        accessToken: data.accessToken,
        admin: data.user,
        expiresIn: data.expiresIn,
      };
    } catch (error) {
      return rejectWithValue('Eroare la reînnoirea sesiunii');
    }
  }
);

/**
 * Deconectare admin - șterge cookie-ul pe server
 */
export const adminLogout = createAsyncThunk(
  'admin/logout',
  async () => {
    try {
      await fetch(`${API_BASE}/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      // Ignorăm erorile - oricum curățăm state-ul local
    }
    return null;
  }
);

// =============================================================================
// SLICE
// =============================================================================

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    setAdminToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setAdminUser: (state, action: PayloadAction<AdminUser>) => {
      state.admin = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    clearAdminAuth: (state) => {
      state.admin = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setAdminLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setNewOrdersCount: (state, action: PayloadAction<number>) => {
      state.newOrdersCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(adminLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.admin = action.payload.admin;
        state.token = action.payload.accessToken;
        state.tokenExpiresAt = Date.now() + (action.payload.expiresIn || 3600) * 1000;
        state.error = null;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // REFRESH TOKEN
      .addCase(adminRefreshToken.pending, (state) => {
        // Nu setăm isLoading pentru refresh în background
      })
      .addCase(adminRefreshToken.fulfilled, (state, action) => {
        state.token = action.payload.accessToken;
        state.admin = action.payload.admin;
        state.tokenExpiresAt = Date.now() + (action.payload.expiresIn || 3600) * 1000;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(adminRefreshToken.rejected, (state) => {
        state.admin = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // LOGOUT
      .addCase(adminLogout.fulfilled, (state) => {
        state.admin = null;
        state.token = null;
        state.isAuthenticated = false;
        state.newOrdersCount = 0;
      });
  },
});

export const { 
  clearAdminError, 
  setAdminToken, 
  setAdminUser,
  clearAdminAuth,
  setAdminLoading,
  setNewOrdersCount
} = adminSlice.actions;

export default adminSlice.reducer;
