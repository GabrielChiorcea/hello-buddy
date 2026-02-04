/**
 * =============================================================================
 * HOOK PENTRU POLLING COMENZI NOI ADMIN
 * =============================================================================
 * 
 * Polling global pentru numărul de comenzi noi în așteptare
 * Rulează continuu când adminul este autentificat
 * =============================================================================
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setNewOrdersCount } from '@/store/slices/adminSlice';
import { useAdminApi } from './useAdminApi';

/** Interval de polling pentru comenzi noi (60 secunde) */
const POLLING_INTERVAL = 60000;

/**
 * Hook pentru polling-ul comenzilor noi în așteptare
 * Actualizează newOrdersCount în Redux la fiecare interval
 */
export const useAdminOrdersPolling = () => {
  const dispatch = useAppDispatch();
  const { getNewOrdersCount } = useAdminApi();
  const isAuthenticated = useAppSelector((state) => state.admin.isAuthenticated);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Funcție pentru verificarea comenzilor noi
  const checkNewOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const count = await getNewOrdersCount();
      dispatch(setNewOrdersCount(count));
    } catch (error) {
      // Ignoră erorile - utilizatorul poate să nu fie autentificat sau conexiunea eșuată
      console.error('[useAdminOrdersPolling] Eroare la verificarea comenzilor noi:', error);
    }
  }, [isAuthenticated, getNewOrdersCount, dispatch]);

  useEffect(() => {
    // Doar dacă adminul este autentificat
    if (!isAuthenticated) {
      // Oprește polling-ul dacă există
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Verificare inițială
    checkNewOrders();
    
    // Start interval
    pollingRef.current = setInterval(checkNewOrders, POLLING_INTERVAL);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isAuthenticated, checkNewOrders]);
};
