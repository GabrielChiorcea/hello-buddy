/**
 * =============================================================================
 * EXPORT CENTRAL PENTRU HOOK-URILE GRAPHQL
 * =============================================================================
 * 
 * Acest fișier centralizează exportul tuturor hook-urilor Apollo.
 * 
 * Permite importuri simplificate în componente:
 * 
 * @example
 * // În loc de:
 * import { useProducts } from '@/graphql/hooks/useProducts';
 * import { useLogin } from '@/graphql/hooks/useAuth';
 * 
 * // Poți folosi:
 * import { useProducts, useLogin } from '@/graphql/hooks';
 * 
 * Categorii de hook-uri:
 * - Produse: useProducts, useProduct, useProductsByCategory, useCategories
 * - Autentificare: useCurrentUser, useLogin, useSignup, useLogout, etc.
 * - Profil: useUpdateProfile
 * - Adrese: useUserAddresses, useCreateAddress, useUpdateAddress, etc.
 * - Comenzi: useUserOrders, useOrder, useCreateOrder, useCancelOrder
 * =============================================================================
 */

// ============================================================================
// HOOK-URI PRODUSE
// ============================================================================

export {
  useProducts, // Obține toate produsele
  useProduct, // Obține un produs după ID
  useProductsByCategory, // Filtrează după categorie
  useCategories, // Obține lista categoriilor
} from './useProducts';

// ============================================================================
// HOOK-URI AUTENTIFICARE
// ============================================================================

export { 
  useCurrentUser,         // Obține utilizatorul autentificat
  useLogin,              // Autentificare
  useSignup,             // Înregistrare
  useLogout,             // Deconectare
  useRequestPasswordReset, // Solicitare resetare parolă
  useDeleteAccount       // Ștergere cont
} from './useAuth';

// ============================================================================
// HOOK-URI ADRESE
// ============================================================================

export { 
  useUserAddresses,     // Obține adresele utilizatorului
  useCreateAddress,     // Creează adresă nouă
  useUpdateAddress,     // Actualizează adresă
  useDeleteAddress,     // Șterge adresă
  useSetDefaultAddress  // Setează adresă implicită
} from './useAddresses';

// ============================================================================
// HOOK-URI COMENZI
// ============================================================================

export { 
  useUserOrders,  // Obține istoricul comenzilor
  useOrder,       // Obține detalii comandă
  useCreateOrder, // Plasează comandă nouă
  useCancelOrder  // Anulează comandă
} from './useOrders';
