/**
 * =============================================================================
 * HOOK PENTRU RESTAURARE SESIUNE LA REFRESH
 * =============================================================================
 * 
 * SECURITY: Folosește HttpOnly cookie pentru refresh token
 * Browserul trimite automat cookie-ul, frontend-ul primește doar access token
 * =============================================================================
 */

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { restoreSession } from '@/store/slices/userSlice';
import { adminRefreshToken, setAdminLoading } from '@/store/slices/adminSlice';

/**
 * Hook pentru restaurarea sesiunii la încărcarea aplicației
 * Restaurează atât sesiunea utilizator cât și cea admin
 */
export const useSessionRestore = () => {
  const dispatch = useAppDispatch();
  const hasInitialized = useRef(false);
  
  const isUserAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const isAdminAuthenticated = useAppSelector((state) => state.admin.isAuthenticated);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Restaurează DOAR sesiunea de user la încărcare.
    // Admin refresh se face doar când accesezi /admin (evită rotații inutile).
    dispatch(restoreSession()).catch(() => {
      // Erorile sunt gestionate în slice
    });
  }, [dispatch]);
  
  return {
    isUserLoading: useAppSelector((state) => state.user.isLoading),
    isAdminLoading: useAppSelector((state) => state.admin.isLoading),
    isUserAuthenticated,
    isAdminAuthenticated,
  };
};

/**
 * Hook pentru restaurarea sesiunii utilizator
 */
export function useUserSessionRestore() {
  const dispatch = useAppDispatch();
  const hasAttempted = useRef(false);
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.user);
  
  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;
    
    if (isAuthenticated) return;
    
    dispatch(restoreSession());
  }, [dispatch, isAuthenticated]);
  
  return { isLoading };
}

/**
 * Hook pentru restaurarea sesiunii admin
 */
export function useAdminSessionRestore() {
  const dispatch = useAppDispatch();
  const hasAttempted = useRef(false);
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.admin);
  
  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;
    
    if (isAuthenticated) {
      dispatch(setAdminLoading(false));
      return;
    }
    
    dispatch(adminRefreshToken());
  }, [dispatch, isAuthenticated]);
  
  return { isLoading };
}

export default useSessionRestore;
