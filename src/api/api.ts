/**
 * =============================================================================
 * API LAYER - Folosește Apollo Client pentru toate operațiunile
 * =============================================================================
 * 
 * Toate funcțiile API comunică cu backend-ul real prin GraphQL.
 * Nu mai există date mock în acest fișier.
 */

import { apolloClient } from '@/graphql/client';
import {
  GET_PRODUCTS,
  GET_PRODUCT_BY_ID,
  GET_PRODUCTS_BY_CATEGORY,
  GET_RECOMMENDED_PRODUCTS,
  GET_APP_STATS,
  GET_ADDON_PRODUCTS,
  GET_SUGGESTED_ADDONS_FOR_CART,
  SEARCH_PRODUCTS,
  GET_CATEGORIES,
  GET_CURRENT_USER,
  GET_USER_ORDERS,
  GET_USER_ADDRESSES
} from '@/graphql/queries';
import { 
  LOGIN,
  SIGNUP,
  LOGOUT,
  REFRESH_TOKEN,
  CHANGE_PASSWORD,
  REQUEST_PASSWORD_RESET,
  RESET_PASSWORD,
  DELETE_ACCOUNT,
  CREATE_ADDRESS,
  UPDATE_ADDRESS,
  DELETE_ADDRESS,
  SET_DEFAULT_ADDRESS,
  CREATE_ORDER,
  CANCEL_ORDER,
  CREATE_PAYMENT_SESSION,
  CONFIRM_PAYMENT_SESSION,
  MARK_WELCOME_BONUS_SEEN
} from '@/graphql/mutations';
import { 
  Product, 
  User, 
  Order, 
  LoginCredentials, 
  SignupData, 
  CheckoutData,
  ApiResponse,
  CartItem,
  DeliveryAddress,
  AuthTokens,
  Category
} from '@/types';
import { getErrorMessage } from '@/lib/errorMessages';

// ============================================================================
// AUTH API
// ============================================================================

/**
 * AuthPayload din backend - refreshToken este în HttpOnly cookie
 */
interface AuthPayload {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export const loginApi = async (
  credentials: LoginCredentials
): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
  try {
    const { data } = await apolloClient.mutate<{ login: AuthPayload }>({
      mutation: LOGIN,
      variables: { input: credentials },
    });
    
    if (!data?.login) {
      return { success: false, error: 'Autentificare eșuată' };
    }
    
    const { user, accessToken, expiresIn } = data.login;
    
    // Backend setează refreshToken în HttpOnly cookie
    return { 
      success: true, 
      data: {
        user,
        tokens: {
          accessToken,
          accessTokenExpiresAt: Date.now() + (expiresIn * 1000),
        },
      },
      message: 'Autentificare reușită'
    };
  } catch (error) {
    console.error('Login API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const signupApi = async (
  data: SignupData
): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
  try {
    const { data: result } = await apolloClient.mutate<{ signup: AuthPayload }>({
      mutation: SIGNUP,
      variables: { input: data },
    });
    
    if (!result?.signup) {
      return { success: false, error: 'Înregistrare eșuată' };
    }
    
    const { user, accessToken, expiresIn } = result.signup;
    
    // Backend setează refreshToken în HttpOnly cookie
    return { 
      success: true, 
      data: {
        user,
        tokens: {
          accessToken,
          accessTokenExpiresAt: Date.now() + (expiresIn * 1000),
        },
      },
      message: 'Cont creat cu succes'
    };
  } catch (error) {
    console.error('Signup API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const logoutApi = async (): Promise<ApiResponse<null>> => {
  try {
    await apolloClient.mutate({ mutation: LOGOUT });
    await apolloClient.clearStore();
    return { success: true, message: 'Deconectat cu succes' };
  } catch (error) {
    console.error('Logout API error:', error);
    return { success: false, error: 'Eroare la deconectare' };
  }
};

export const refreshTokenApi = async (
  refreshToken: string
): Promise<ApiResponse<{ accessToken: string; expiresIn: number }>> => {
  try {
    const { data } = await apolloClient.mutate<{ 
      refreshToken: { accessToken: string; expiresIn: number } 
    }>({
      mutation: REFRESH_TOKEN,
      variables: { refreshToken },
    });
    
    if (!data?.refreshToken) {
      return { success: false, error: 'Token invalid' };
    }
    
    return { success: true, data: data.refreshToken };
  } catch (error) {
    console.error('Refresh token API error:', error);
    return { success: false, error: 'Sesiune expirată' };
  }
};

// ============================================================================
// USER PROFILE API
// ============================================================================

export const getCurrentUserApi = async (): Promise<ApiResponse<User>> => {
  try {
    const { data } = await apolloClient.query<{ currentUser: User }>({
      query: GET_CURRENT_USER,
      fetchPolicy: 'network-only',
    });
    
    if (!data?.currentUser) {
      return { success: false, error: 'Utilizator neautentificat' };
    }
    
    return { success: true, data: data.currentUser };
  } catch (error) {
    console.error('Get current user API error:', error);
    return { success: false, error: 'Eroare la obținerea profilului' };
  }
};

export const changePasswordApi = async (
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<boolean>> => {
  try {
    const { data } = await apolloClient.mutate<{ changePassword: boolean }>({
      mutation: CHANGE_PASSWORD,
      variables: { currentPassword, newPassword },
    });
    
    return { 
      success: data?.changePassword ?? false,
      message: data?.changePassword ? 'Parolă schimbată cu succes' : 'Eroare la schimbarea parolei'
    };
  } catch (error) {
    console.error('Change password API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const requestPasswordResetApi = async (
  email: string
): Promise<ApiResponse<null>> => {
  try {
    await apolloClient.mutate({
      mutation: REQUEST_PASSWORD_RESET,
      variables: { email },
    });
    
    return { 
      success: true, 
      message: 'Email de resetare trimis (dacă contul există)'
    };
  } catch (error) {
    console.error('Request password reset API error:', error);
    return { success: false, error: 'Eroare la trimiterea email-ului' };
  }
};

export const resetPasswordApi = async (
  token: string,
  newPassword: string
): Promise<ApiResponse<null>> => {
  try {
    const { data } = await apolloClient.mutate<{ resetPassword: boolean }>({
      mutation: RESET_PASSWORD,
      variables: { token, newPassword },
    });
    if (data?.resetPassword) {
      return { success: true, message: 'Parola a fost resetată' };
    }
    return { success: false, error: 'Eroare la resetarea parolei' };
  } catch (error) {
    console.error('Reset password API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const deleteAccountApi = async (
  _userId: string, // Ignorat - backend-ul folosește JWT context
  data: { password: string; confirmText: string }
): Promise<ApiResponse<null>> => {
  try {
    const { data: result } = await apolloClient.mutate<{ deleteAccount: boolean }>({
      mutation: DELETE_ACCOUNT,
      variables: data,
    });
    
    if (result?.deleteAccount) {
      await apolloClient.clearStore();
      return { success: true, message: 'Cont șters cu succes' };
    }
    
    return { success: false, error: 'Ștergere eșuată' };
  } catch (error) {
    console.error('Delete account API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const markWelcomeBonusSeenApi = async (): Promise<ApiResponse<boolean>> => {
  try {
    const { data } = await apolloClient.mutate<{ markWelcomeBonusSeen: boolean }>({
      mutation: MARK_WELCOME_BONUS_SEEN,
    });
    if (data?.markWelcomeBonusSeen !== undefined) {
      return { success: true, data: data.markWelcomeBonusSeen };
    }
    return { success: false, error: 'Eroare la marcarea popup-ului' };
  } catch (error) {
    console.error('Mark welcome bonus seen API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

// ============================================================================
// PRODUCTS API
// ============================================================================

export const fetchProductsApi = async (): Promise<ApiResponse<Product[]>> => {
  try {
    const { data } = await apolloClient.query<{ products: Product[] }>({
      query: GET_PRODUCTS,
      fetchPolicy: 'cache-first',
    });
    
    return { success: true, data: data?.products || [] };
  } catch (error) {
    console.error('Fetch products API error:', error);
    return { success: false, error: 'Eroare la încărcarea produselor' };
  }
};

export const fetchRecommendedProductsApi = async (): Promise<ApiResponse<Product[]>> => {
  try {
    const { data } = await apolloClient.query<{ recommendedProducts: Product[] }>({
      query: GET_RECOMMENDED_PRODUCTS,
      fetchPolicy: 'cache-first',
    });
    return { success: true, data: data?.recommendedProducts || [] };
  } catch (error) {
    console.error('Fetch recommended products API error:', error);
    return { success: false, error: 'Eroare la încărcarea produselor recomandate' };
  }
};

export interface AppStats {
  totalProducts: number;
}

export const fetchAppStatsApi = async (): Promise<ApiResponse<AppStats>> => {
  try {
    const { data } = await apolloClient.query<{ appStats: AppStats }>({
      query: GET_APP_STATS,
      fetchPolicy: 'cache-first',
    });
    return { success: true, data: data?.appStats ?? { totalProducts: 0 } };
  } catch (error) {
    console.error('Fetch app stats API error:', error);
    return { success: false, error: 'Eroare la încărcarea statisticilor' };
  }
};

export const fetchProductByIdApi = async (id: string): Promise<ApiResponse<Product>> => {
  try {
    const { data } = await apolloClient.query<{ product: Product }>({
      query: GET_PRODUCT_BY_ID,
      variables: { id },
    });
    
    if (!data?.product) {
      return { success: false, error: 'Produs negăsit' };
    }
    
    return { success: true, data: data.product };
  } catch (error) {
    console.error('Fetch product API error:', error);
    return { success: false, error: 'Eroare la încărcarea produsului' };
  }
};

export const fetchProductsByCategoryApi = async (
  category: string
): Promise<ApiResponse<Product[]>> => {
  try {
    const { data } = await apolloClient.query<{ productsByCategory: Product[] }>({
      query: GET_PRODUCTS_BY_CATEGORY,
      variables: { category },
    });
    
    return { success: true, data: data?.productsByCategory || [] };
  } catch (error) {
    console.error('Fetch products by category API error:', error);
    return { success: false, error: 'Eroare la filtrarea produselor' };
  }
};

export const fetchAddonProductsApi = async (): Promise<ApiResponse<Product[]>> => {
  try {
    const { data } = await apolloClient.query<{ addonProducts: Product[] }>({
      query: GET_ADDON_PRODUCTS,
    });
    return { success: true, data: data?.addonProducts || [] };
  } catch (error) {
    console.error('Fetch addon products API error:', error);
    return { success: false, error: 'Eroare la încărcarea produselor add-on' };
  }
};

export interface AddonSuggestion {
  product: Product;
  ruleId: number | null;
}

export const fetchSuggestedAddonsForCartApi = async (
  cartProductIds: string[]
): Promise<ApiResponse<AddonSuggestion[]>> => {
  try {
    const { data } = await apolloClient.query<{
      suggestedAddonsForCart: AddonSuggestion[];
    }>({
      query: GET_SUGGESTED_ADDONS_FOR_CART,
      variables: { cartProductIds },
      fetchPolicy: 'network-only',
    });
    return { success: true, data: data?.suggestedAddonsForCart || [] };
  } catch (error) {
    console.error('Fetch suggested addons API error:', error);
    return { success: false, error: 'Eroare la încărcarea sugestiilor add-on' };
  }
};

export const searchProductsApi = async (query: string): Promise<ApiResponse<Product[]>> => {
  try {
    const { data } = await apolloClient.query<{ searchProducts: Product[] }>({
      query: SEARCH_PRODUCTS,
      variables: { query },
    });
    
    return { success: true, data: data?.searchProducts || [] };
  } catch (error) {
    console.error('Search products API error:', error);
    return { success: false, error: 'Eroare la căutare' };
  }
};

export const fetchCategoriesApi = async (): Promise<ApiResponse<Category[]>> => {
  try {
    const { data } = await apolloClient.query<{ categories: Category[] }>({
      query: GET_CATEGORIES,
      fetchPolicy: 'cache-first',
    });
    
    return { success: true, data: data?.categories || [] };
  } catch (error) {
    console.error('Fetch categories API error:', error);
    return { success: false, error: 'Eroare la încărcarea categoriilor' };
  }
};

// ============================================================================
// ORDERS API
// ============================================================================

export const fetchOrdersApi = async (
  _userId?: string // Ignorat - backend-ul folosește JWT context
): Promise<ApiResponse<Order[]>> => {
  try {
    const { data } = await apolloClient.query<{ orders: Order[] }>({
      query: GET_USER_ORDERS,
      fetchPolicy: 'network-only',
    });
    
    return { success: true, data: data?.orders || [] };
  } catch (error) {
    console.error('Fetch orders API error:', error);
    return { success: false, error: 'Eroare la încărcarea comenzilor' };
  }
};

export interface CreatePaymentSessionResult {
  clientSecret: string | null;
  redirectUrl: string | null;
  paymentId: string;
  draftId: string;
}

export const createPaymentSessionApi = async (
  items: CartItem[],
  checkoutData: CheckoutData,
  amountRon: number
): Promise<ApiResponse<CreatePaymentSessionResult>> => {
  try {
    const isInLocation = checkoutData.fulfillmentType === 'in_location';
    const tableNumberValue = checkoutData.tableNumber?.trim() || null;
    const orderInput = {
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        configuration: item.configuration,
        unitPriceWithConfiguration: item.unitPriceWithConfiguration,
      })),
      fulfillmentType: checkoutData.fulfillmentType ?? 'delivery',
      tableNumber: isInLocation ? tableNumberValue : undefined,
      deliveryAddress: isInLocation ? 'În locație' : checkoutData.deliveryAddress,
      deliveryCity: isInLocation ? 'În locație' : checkoutData.deliveryCity,
      phone: checkoutData.phone,
      notes: checkoutData.notes || null,
      paymentMethod: 'card' as const,
      pointsToUse: checkoutData.pointsToUse || undefined,
    };

    const { data } = await apolloClient.mutate<{ createPaymentSession: CreatePaymentSessionResult }>({
      mutation: CREATE_PAYMENT_SESSION,
      variables: { input: orderInput, amountRon },
    });

    if (!data?.createPaymentSession) {
      return { success: false, error: 'Eroare la crearea sesiunii de plată' };
    }

    return {
      success: true,
      data: data.createPaymentSession,
    };
  } catch (error) {
    console.error('Create payment session API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const confirmPaymentSessionApi = async (sessionId: string): Promise<ApiResponse<Order>> => {
  try {
    const { data } = await apolloClient.mutate<{ confirmPaymentSession: Order }>({
      mutation: CONFIRM_PAYMENT_SESSION,
      variables: { sessionId },
      refetchQueries: [{ query: GET_USER_ORDERS }, { query: GET_CURRENT_USER }],
    });
    if (!data?.confirmPaymentSession) {
      return { success: false, error: 'Eroare la confirmarea plății' };
    }
    return { success: true, data: data.confirmPaymentSession };
  } catch (error) {
    console.error('Confirm payment session API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const placeOrderApi = async (
  _userId: string, // Ignorat - backend-ul folosește JWT context
  items: CartItem[],
  checkoutData: CheckoutData,
  _subtotal: number,
  _deliveryFee: number,
  _total: number
): Promise<ApiResponse<Order>> => {
  try {
    const isInLocation = checkoutData.fulfillmentType === 'in_location';
    const tableNumberValue = checkoutData.tableNumber?.trim() || null;
    const orderInput = {
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      fulfillmentType: checkoutData.fulfillmentType ?? 'delivery',
      tableNumber: isInLocation ? tableNumberValue : undefined,
      deliveryAddress: isInLocation ? 'În locație' : checkoutData.deliveryAddress,
      deliveryCity: isInLocation ? 'În locație' : checkoutData.deliveryCity,
      phone: checkoutData.phone,
      notes: checkoutData.notes || null,
      paymentMethod: checkoutData.paymentMethod,
      pointsToUse: checkoutData.pointsToUse || undefined,
    };

    const { data } = await apolloClient.mutate<{ createOrder: Order }>({
      mutation: CREATE_ORDER,
      variables: { input: orderInput },
      refetchQueries: [{ query: GET_USER_ORDERS }, { query: GET_CURRENT_USER }],
    });
    
    if (!data?.createOrder) {
      return { success: false, error: 'Eroare la plasarea comenzii' };
    }
    
    return { 
      success: true, 
      data: data.createOrder,
      message: 'Comandă plasată cu succes'
    };
  } catch (error) {
    console.error('Place order API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const cancelOrderApi = async (orderId: string): Promise<ApiResponse<Order>> => {
  try {
    const { data } = await apolloClient.mutate<{ cancelOrder: Order }>({
      mutation: CANCEL_ORDER,
      variables: { id: orderId },
      refetchQueries: [{ query: GET_USER_ORDERS }],
    });
    
    if (!data?.cancelOrder) {
      return { success: false, error: 'Eroare la anularea comenzii' };
    }
    
    return { 
      success: true, 
      data: data.cancelOrder,
      message: 'Comandă anulată'
    };
  } catch (error) {
    console.error('Cancel order API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

// ============================================================================
// ADDRESSES API
// ============================================================================

export const fetchAddressesApi = async (
  _userId?: string // Ignorat - backend-ul folosește JWT context
): Promise<ApiResponse<DeliveryAddress[]>> => {
  try {
    const { data } = await apolloClient.query<{ addresses: DeliveryAddress[] }>({
      query: GET_USER_ADDRESSES,
      fetchPolicy: 'network-only',
    });
    
    return { success: true, data: data?.addresses || [] };
  } catch (error) {
    console.error('Fetch addresses API error:', error);
    return { success: false, error: 'Eroare la încărcarea adreselor' };
  }
};

export const saveAddressApi = async (
  _userId: string, // Ignorat
  address: Omit<DeliveryAddress, 'id'>
): Promise<ApiResponse<DeliveryAddress>> => {
  try {
    const { data } = await apolloClient.mutate<{ createAddress: DeliveryAddress }>({
      mutation: CREATE_ADDRESS,
      variables: { 
        input: {
          label: address.label,
          address: address.address,
          city: address.city,
          phone: address.phone,
          notes: address.notes || null,
          isDefault: address.isDefault || false,
        }
      },
      refetchQueries: [{ query: GET_USER_ADDRESSES }],
    });
    
    if (!data?.createAddress) {
      return { success: false, error: 'Eroare la salvarea adresei' };
    }
    
    return { 
      success: true, 
      data: data.createAddress,
      message: 'Adresă salvată'
    };
  } catch (error) {
    console.error('Save address API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const updateAddressApi = async (
  addressId: string,
  _userId: string, // Ignorat
  updates: Partial<DeliveryAddress>
): Promise<ApiResponse<DeliveryAddress>> => {
  try {
    const { data } = await apolloClient.mutate<{ updateAddress: DeliveryAddress }>({
      mutation: UPDATE_ADDRESS,
      variables: { 
        id: addressId,
        input: {
          label: updates.label,
          address: updates.address,
          city: updates.city,
          phone: updates.phone,
          notes: updates.notes || null,
          isDefault: updates.isDefault || false,
        }
      },
      refetchQueries: [{ query: GET_USER_ADDRESSES }],
    });
    
    if (!data?.updateAddress) {
      return { success: false, error: 'Eroare la actualizarea adresei' };
    }
    
    return { 
      success: true, 
      data: data.updateAddress,
      message: 'Adresă actualizată'
    };
  } catch (error) {
    console.error('Update address API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const deleteAddressApi = async (
  addressId: string,
  _userId?: string // Ignorat
): Promise<ApiResponse<null>> => {
  try {
    await apolloClient.mutate({
      mutation: DELETE_ADDRESS,
      variables: { id: addressId },
      refetchQueries: [{ query: GET_USER_ADDRESSES }],
    });
    
    return { success: true, message: 'Adresă ștearsă' };
  } catch (error) {
    console.error('Delete address API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

export const setDefaultAddressApi = async (
  addressId: string
): Promise<ApiResponse<DeliveryAddress>> => {
  try {
    const { data } = await apolloClient.mutate<{ setDefaultAddress: DeliveryAddress }>({
      mutation: SET_DEFAULT_ADDRESS,
      variables: { id: addressId },
      refetchQueries: [{ query: GET_USER_ADDRESSES }],
    });
    
    if (!data?.setDefaultAddress) {
      return { success: false, error: 'Eroare la setarea adresei implicite' };
    }
    
    return { 
      success: true, 
      data: data.setDefaultAddress,
      message: 'Adresă setată ca implicită'
    };
  } catch (error) {
    console.error('Set default address API error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

// ============================================================================
// ANALYTICS – conversii add-on
// ============================================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Înregistrează un eveniment de tip „produs adăugat din secțiunea Add-ons" (origin_addons).
 * Folosit pentru măsurarea ratei de conversie a regulilor.
 */
export async function trackAddonConversion(payload: {
  productId: string;
  ruleId?: number | null;
  origin?: string;
  cartId?: string | null;
  cartValue?: number | null;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/track-addon-conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: payload.productId,
        ruleId: payload.ruleId ?? null,
        origin: payload.origin ?? 'origin_addons',
        cartId: payload.cartId ?? null,
        cartValue: payload.cartValue ?? null,
      }),
    });
  } catch {
    // Fire-and-forget; nu blocăm UI-ul
  }
}

