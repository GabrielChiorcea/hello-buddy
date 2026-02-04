/**
 * =============================================================================
 * HOOK-URI APOLLO PENTRU PROFIL UTILIZATOR
 * =============================================================================
 * 
 * Acest fișier conține hook-urile React pentru gestionarea profilului.
 * 
 * Hook-uri disponibile:
 * - useUpdateProfile: actualizează datele de profil ale utilizatorului
 * 
 * Funcționalități:
 * - Actualizare parțială a profilului (doar câmpurile trimise)
 * - Sincronizare automată cu localStorage
 * - Actualizare cache Apollo
 * =============================================================================
 */

import { useMutation, useApolloClient } from '@apollo/client';
import { UPDATE_PROFILE } from '../mutations';
import { GET_CURRENT_USER } from '../queries';
import { User, ProfileUpdateData } from '@/types';
import { useCallback } from 'react';

// ============================================================================
// HOOK-URI
// ============================================================================

/**
 * Hook pentru actualizarea profilului utilizatorului
 * 
 * Câmpuri actualizabile:
 * - name: Numele complet
 * - phone: Număr de telefon
 * - address: Adresa principală
 * - city: Orașul
 * 
 * După actualizare:
 * 1. Datele sunt salvate în localStorage
 * 2. Cache-ul Apollo este actualizat
 * 
 * @returns {Object} Obiect cu:
 *   - updateProfile: funcție async pentru actualizare
 *   - loading: true în timpul actualizării
 *   - error: mesajul de eroare sau null
 * 
 * @example
 * const { updateProfile, loading } = useUpdateProfile();
 * const result = await updateProfile(userId, { 
 *   name: 'Ion Popescu',
 *   phone: '0712345678'
 * });
 */
export const useUpdateProfile = () => {
  const client = useApolloClient(); // Acces la instanța Apollo Client
  const [mutation, { loading, error }] = useMutation<{ updateProfile: User }>(UPDATE_PROFILE);
  
  /**
   * Funcție pentru actualizarea profilului
   * @param userId - ID-ul utilizatorului
   * @param data - Câmpurile de actualizat (name, phone, address, city)
   * @returns Promise cu rezultatul (success, user sau error)
   */
  const updateProfile = useCallback(async (userId: string, data: ProfileUpdateData) => {
    try {
      const { data: result } = await mutation({
        variables: { userId, input: data },
      });
      
      if (result?.updateProfile) {
        // Actualizare localStorage cu noile date
        localStorage.setItem('user', JSON.stringify(result.updateProfile));
        
        // Actualizare cache Apollo pentru consistență
        client.writeQuery({
          query: GET_CURRENT_USER,
          data: { currentUser: result.updateProfile },
        });
        
        return { success: true, user: result.updateProfile };
      }
      
      return { success: false, error: 'Nu s-a putut actualiza profilul' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nu s-a putut actualiza profilul';
      console.error('Eroare la actualizarea profilului:', message);
      return { success: false, error: message };
    }
  }, [mutation, client]);
  
  return {
    updateProfile,
    loading,
    error: error?.message || null,
  };
};
