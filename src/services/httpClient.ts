/**
 * =============================================================================
 * SERVICIU HTTP CLIENT CU GESTIUNE JWT
 * =============================================================================
 * 
 * Acest fișier conține clientul HTTP centralizat pentru toate cererile API.
 * 
 * Funcționalități principale:
 * - Injectare automată a accessToken în header-ul Authorization
 * - Refresh automat al token-ului când expiră (401)
 * - Coadă de cereri în așteptare în timpul refresh-ului
 * - Gestionarea erorilor de rețea
 * 
 * IMPORTANT: Token-urile sunt stocate DOAR în memorie (Redux), nu în localStorage!
 * =============================================================================
 */

import { store } from '@/store';
import { setTokens, clearAuth, setIsRefreshing } from '@/store/slices/userSlice';
import { AuthTokens, RefreshTokenResponse } from '@/types';

// =============================================================================
// CONFIGURARE
// =============================================================================

/** URL-ul de bază pentru API */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/** Endpoint pentru refresh token */
const REFRESH_TOKEN_ENDPOINT = '/auth/refresh';

/** Timp înainte de expirare pentru refresh preventiv (5 minute în ms) */
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// =============================================================================
// STARE INTERNĂ PENTRU REFRESH
// =============================================================================

/** Coadă de cereri în așteptare în timpul refresh-ului */
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

/** Promise pentru refresh-ul în curs (pentru a evita multiple refresh-uri simultane) */
let refreshPromise: Promise<string> | null = null;

// =============================================================================
// FUNCȚII HELPER
// =============================================================================

/**
 * Obține token-urile curente din Redux store
 */
const getTokens = (): AuthTokens | null => {
  return store.getState().user.tokens;
};

/**
 * Verifică dacă accessToken este expirat sau aproape de expirare
 */
const isTokenExpired = (tokens: AuthTokens | null): boolean => {
  if (!tokens) return true;
  
  const now = Date.now();
  // Considerăm token-ul expirat dacă mai are mai puțin de REFRESH_THRESHOLD_MS
  return tokens.accessTokenExpiresAt - now < REFRESH_THRESHOLD_MS;
};

/**
 * Efectuează cererea de refresh token
 * Returnează noul accessToken sau aruncă eroare
 */
const performRefresh = async (): Promise<string> => {
  const tokens = getTokens();
  
  if (!tokens?.refreshToken) {
    throw new Error('Nu există refresh token');
  }
  
  store.dispatch(setIsRefreshing(true));
  
  try {
    const response = await fetch(`${API_BASE_URL}${REFRESH_TOKEN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Refresh token invalid sau expirat');
    }
    
    const data: RefreshTokenResponse = await response.json();
    
    // Actualizează token-urile în Redux
    const newTokens: AuthTokens = {
      accessToken: data.accessToken,
      refreshToken: tokens.refreshToken, // Păstrăm refresh token-ul existent
      accessTokenExpiresAt: Date.now() + (data.expiresIn * 1000),
    };
    
    store.dispatch(setTokens(newTokens));
    
    return data.accessToken;
  } catch (error) {
    // Refresh a eșuat - utilizatorul trebuie să se re-autentifice
    store.dispatch(clearAuth());
    throw error;
  } finally {
    store.dispatch(setIsRefreshing(false));
  }
};

/**
 * Gestionează refresh-ul token-ului cu suport pentru cereri concurente
 * Toate cererile care așteaptă vor primi noul token odată ce refresh-ul se termină
 */
const handleTokenRefresh = async (): Promise<string> => {
  // Dacă există deja un refresh în curs, așteptăm rezultatul
  if (refreshPromise) {
    return refreshPromise;
  }
  
  // Creăm promise-ul pentru refresh
  refreshPromise = performRefresh()
    .then((newToken) => {
      // Rezolvăm toate cererile din coadă cu noul token
      refreshQueue.forEach(({ resolve }) => resolve(newToken));
      refreshQueue = [];
      return newToken;
    })
    .catch((error) => {
      // Rejectăm toate cererile din coadă
      refreshQueue.forEach(({ reject }) => reject(error));
      refreshQueue = [];
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });
  
  return refreshPromise;
};

// =============================================================================
// CLIENT HTTP PRINCIPAL
// =============================================================================

/** Opțiuni pentru cereri HTTP */
interface HttpOptions extends Omit<RequestInit, 'body'> {
  /** Dacă true, nu adaugă header-ul Authorization */
  skipAuth?: boolean;
  /** Body-ul cererii (va fi serializat automat în JSON) */
  body?: unknown;
}

/**
 * Efectuează o cerere HTTP cu gestionare automată a token-urilor JWT
 * 
 * @param endpoint - Endpoint-ul API (relativ la API_BASE_URL)
 * @param options - Opțiuni pentru cerere
 * @returns Promise cu răspunsul deserializat
 * 
 * @example
 * // GET request
 * const products = await httpClient('/products');
 * 
 * // POST request cu body
 * const order = await httpClient('/orders', {
 *   method: 'POST',
 *   body: { items: [...] }
 * });
 * 
 * // Request fără autentificare
 * const publicData = await httpClient('/public', { skipAuth: true });
 */
export const httpClient = async <T = unknown>(
  endpoint: string,
  options: HttpOptions = {}
): Promise<T> => {
  const { skipAuth = false, body, ...fetchOptions } = options;
  
  // Construiește URL-ul complet
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Pregătește header-urile
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };
  
  // Adaugă token-ul de autentificare dacă este necesar
  if (!skipAuth) {
    let tokens = getTokens();
    
    // Verifică dacă token-ul trebuie reînnoit preventiv
    if (tokens && isTokenExpired(tokens)) {
      try {
        const newToken = await handleTokenRefresh();
        headers['Authorization'] = `Bearer ${newToken}`;
      } catch (error) {
        // Refresh a eșuat, continuăm fără token
        console.error('Token refresh failed:', error);
      }
    } else if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
  }
  
  // Efectuează cererea
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  // Gestionare eroare 401 (Unauthorized)
  if (response.status === 401 && !skipAuth) {
    try {
      // Încearcă să reînnoiești token-ul
      const newToken = await handleTokenRefresh();
      
      // Reîncearcă cererea cu noul token
      const retryResponse = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          'Authorization': `Bearer ${newToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!retryResponse.ok) {
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }
      
      return retryResponse.json();
    } catch (error) {
      // Refresh a eșuat - curățăm sesiunea și aruncăm eroarea
      store.dispatch(clearAuth());
      throw error;
    }
  }
  
  // Gestionare alte erori HTTP
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  // Returnează răspunsul deserializat
  return response.json();
};

// =============================================================================
// METODE HELPER
// =============================================================================

/**
 * Cerere GET
 */
export const get = <T = unknown>(endpoint: string, options?: HttpOptions): Promise<T> => {
  return httpClient<T>(endpoint, { ...options, method: 'GET' });
};

/**
 * Cerere POST
 */
export const post = <T = unknown>(endpoint: string, body?: unknown, options?: HttpOptions): Promise<T> => {
  return httpClient<T>(endpoint, { ...options, method: 'POST', body });
};

/**
 * Cerere PUT
 */
export const put = <T = unknown>(endpoint: string, body?: unknown, options?: HttpOptions): Promise<T> => {
  return httpClient<T>(endpoint, { ...options, method: 'PUT', body });
};

/**
 * Cerere PATCH
 */
export const patch = <T = unknown>(endpoint: string, body?: unknown, options?: HttpOptions): Promise<T> => {
  return httpClient<T>(endpoint, { ...options, method: 'PATCH', body });
};

/**
 * Cerere DELETE
 */
export const del = <T = unknown>(endpoint: string, options?: HttpOptions): Promise<T> => {
  return httpClient<T>(endpoint, { ...options, method: 'DELETE' });
};

export default httpClient;
