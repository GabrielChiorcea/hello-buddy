/**
 * =============================================================================
 * HOOK PENTRU REFRESH AUTOMAT AL TOKEN-URILOR
 * =============================================================================
 * 
 * SECURITY: Refresh-ul se bazează pe HttpOnly cookie
 * Access token-ul este reînnoit proactiv înainte de expirare
 * =============================================================================
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { refreshAccessToken, setIsRefreshing, clearAuth } from '@/store/slices/userSlice';
import { adminRefreshToken } from '@/store/slices/adminSlice';

/** Timp înainte de expirare pentru refresh preventiv (2 minute în ms) */
const REFRESH_THRESHOLD_MS = 2 * 60 * 1000;

/** Interval de verificare a expirării (1 minut în ms) */
const CHECK_INTERVAL_MS = 60 * 1000;

/**
 * Hook pentru reîmprospătarea automată a token-ului utilizator
 */
export const useTokenRefresh = () => {
  const dispatch = useAppDispatch();
  const tokens = useAppSelector((state) => state.user.tokens);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const isRefreshing = useAppSelector((state) => state.user.isRefreshing);
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Efectuează refresh-ul token-ului
   */
  const performRefresh = useCallback(async (): Promise<boolean> => {
    if (isRefreshing) return false;
    
    dispatch(setIsRefreshing(true));
    
    try {
      const result = await dispatch(refreshAccessToken()).unwrap();
      console.log('[useTokenRefresh] Token reînnoit cu succes');
      return true;
    } catch (error) {
      console.error('[useTokenRefresh] Refresh eșuat:', error);
      dispatch(clearAuth());
      return false;
    }
  }, [isRefreshing, dispatch]);
  
  /**
   * Verifică dacă token-ul trebuie reînnoit
   */
  const checkAndRefresh = useCallback(async () => {
    if (!tokens || !isAuthenticated || !tokens.accessTokenExpiresAt) {
      return;
    }
    
    const now = Date.now();
    const timeUntilExpiry = tokens.accessTokenExpiresAt - now;
    
    if (timeUntilExpiry < REFRESH_THRESHOLD_MS && timeUntilExpiry > 0) {
      console.log('[useTokenRefresh] Token aproape de expirare, se reînnoiește...');
      await performRefresh();
    } else if (timeUntilExpiry <= 0) {
      console.log('[useTokenRefresh] Token expirat, se încearcă refresh...');
      await performRefresh();
    }
  }, [tokens, isAuthenticated, performRefresh]);
  
  /**
   * Handler pentru schimbarea vizibilității paginii
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && isAuthenticated) {
      checkAndRefresh();
    }
  }, [isAuthenticated, checkAndRefresh]);
  
  useEffect(() => {
    if (!isAuthenticated || !tokens) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }
    
    // Setup interval pentru verificare periodică
    checkIntervalRef.current = setInterval(checkAndRefresh, CHECK_INTERVAL_MS);
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isAuthenticated, tokens, checkAndRefresh]);
  
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);
  
  return {
    forceRefresh: performRefresh,
    checkAndRefresh,
    isRefreshing,
  };
};

/**
 * Hook pentru reîmprospătarea automată a token-ului admin
 */
export const useAdminTokenRefresh = () => {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, tokenExpiresAt } = useAppSelector((state) => state.admin);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    if (!isAuthenticated || !tokenExpiresAt) {
      return;
    }
    
    const now = Date.now();
    const timeUntilRefresh = tokenExpiresAt - now - REFRESH_THRESHOLD_MS;
    
    if (timeUntilRefresh <= 0) {
      dispatch(adminRefreshToken());
      return;
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      dispatch(adminRefreshToken());
    }, timeUntilRefresh);
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [dispatch, isAuthenticated, tokenExpiresAt]);
};

export default useTokenRefresh;
