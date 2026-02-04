/**
 * =============================================================================
 * HOOK-URI APOLLO PENTRU ADRESE DE LIVRARE
 * =============================================================================
 * 
 * Backend-ul folosește JWT context pentru userId - nu mai trebuie transmis.
 * =============================================================================
 */

import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_ADDRESSES } from '../queries';
import { 
  CREATE_ADDRESS, 
  UPDATE_ADDRESS, 
  DELETE_ADDRESS, 
  SET_DEFAULT_ADDRESS 
} from '../mutations';
import { DeliveryAddress } from '@/types';
import { useCallback } from 'react';

// ============================================================================
// INTERFEȚE
// ============================================================================

interface AddressesData {
  addresses: DeliveryAddress[];
}

interface AddressInput {
  label: string;
  address: string;
  city: string;
  phone: string;
  notes?: string;
  isDefault?: boolean;
}

// ============================================================================
// HOOK-URI
// ============================================================================

/**
 * Hook pentru obținerea adreselor - folosește JWT context
 */
export const useUserAddresses = () => {
  const { data, loading, error, refetch } = useQuery<AddressesData>(
    GET_USER_ADDRESSES,
    {
      fetchPolicy: 'cache-and-network',
    }
  );
  
  return {
    addresses: data?.addresses || [],
    loading,
    error: error?.message || null,
    refetch,
  };
};

export const useCreateAddress = () => {
  const [mutation, { loading, error }] = useMutation<{ createAddress: DeliveryAddress }>(
    CREATE_ADDRESS,
    {
      refetchQueries: [{ query: GET_USER_ADDRESSES }],
    }
  );
  
  const createAddress = useCallback(async (input: AddressInput) => {
    try {
      const { data } = await mutation({ variables: { input } });
      
      if (data?.createAddress) {
        return { success: true, address: data.createAddress };
      }
      
      return { success: false, error: 'Nu s-a putut crea adresa' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nu s-a putut crea adresa';
      console.error('Eroare la crearea adresei:', message);
      return { success: false, error: message };
    }
  }, [mutation]);
  
  return {
    createAddress,
    loading,
    error: error?.message || null,
  };
};

export const useUpdateAddress = () => {
  const [mutation, { loading, error }] = useMutation<{ updateAddress: DeliveryAddress }>(
    UPDATE_ADDRESS,
    {
      refetchQueries: [{ query: GET_USER_ADDRESSES }],
    }
  );
  
  const updateAddress = useCallback(async (id: string, input: AddressInput) => {
    try {
      const { data } = await mutation({ variables: { id, input } });
      
      if (data?.updateAddress) {
        return { success: true, address: data.updateAddress };
      }
      
      return { success: false, error: 'Nu s-a putut actualiza adresa' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nu s-a putut actualiza adresa';
      console.error('Eroare la actualizarea adresei:', message);
      return { success: false, error: message };
    }
  }, [mutation]);
  
  return {
    updateAddress,
    loading,
    error: error?.message || null,
  };
};

export const useDeleteAddress = () => {
  const [mutation, { loading, error }] = useMutation<{ deleteAddress: boolean }>(
    DELETE_ADDRESS, 
    {
      refetchQueries: [{ query: GET_USER_ADDRESSES }],
    }
  );
  
  const deleteAddress = useCallback(async (id: string) => {
    try {
      const { data } = await mutation({ variables: { id } });
      return { success: data?.deleteAddress ?? false };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nu s-a putut șterge adresa';
      console.error('Eroare la ștergerea adresei:', message);
      return { success: false, message };
    }
  }, [mutation]);
  
  return {
    deleteAddress,
    loading,
    error: error?.message || null,
  };
};

export const useSetDefaultAddress = () => {
  const [mutation, { loading, error }] = useMutation<{ setDefaultAddress: DeliveryAddress }>(
    SET_DEFAULT_ADDRESS,
    {
      refetchQueries: [{ query: GET_USER_ADDRESSES }],
    }
  );
  
  const setDefaultAddress = useCallback(async (id: string) => {
    try {
      const { data } = await mutation({ variables: { id } });
      
      if (data?.setDefaultAddress) {
        return { success: true, address: data.setDefaultAddress };
      }
      
      return { success: false, error: 'Nu s-a putut seta adresa implicită' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nu s-a putut seta adresa implicită';
      console.error('Eroare la setarea adresei implicite:', message);
      return { success: false, error: message };
    }
  }, [mutation]);
  
  return {
    setDefaultAddress,
    loading,
    error: error?.message || null,
  };
};
