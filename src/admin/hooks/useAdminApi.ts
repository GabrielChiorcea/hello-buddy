/**
 * =============================================================================
 * HOOK-URI PENTRU API-UL ADMIN
 * =============================================================================
 * Apeluri REST autentificate către backend-ul admin
 */

import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { adminRefreshToken, clearAdminAuth } from '@/store/slices/adminSlice';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Hook pentru apeluri API autentificate în panoul admin
 */
export const useAdminApi = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.admin.token);
  const tokenExpiresAt = useAppSelector((state) => state.admin.tokenExpiresAt);

  const fetchWithAuth = useCallback(
    async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
      let authToken = token || '';

      // Verifică dacă token-ul expiră în curând (5 minute)
      const now = Date.now();
      if (tokenExpiresAt && tokenExpiresAt - now < 5 * 60 * 1000) {
        try {
          const refreshed = await dispatch(adminRefreshToken()).unwrap();
          authToken = refreshed.accessToken;
        } catch (e) {
          dispatch(clearAdminAuth());
          throw new Error('Sesiune expirată. Vă rugăm să vă autentificați din nou.');
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Încearcă refresh
        try {
          const refreshed = await dispatch(adminRefreshToken()).unwrap();
          authToken = refreshed.accessToken;
          // Retry request
          const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
              ...headers,
              'Authorization': authToken ? `Bearer ${authToken}` : '',
            },
          });
          if (!retryResponse.ok) {
            throw new Error('Unauthorized');
          }
          return retryResponse.json();
        } catch (e) {
          dispatch(clearAdminAuth());
          throw new Error('Sesiune expirată');
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    [token, tokenExpiresAt, dispatch]
  );

  // Dashboard
  const getDashboard = useCallback(
    () => fetchWithAuth('/admin/dashboard'),
    [fetchWithAuth]
  );

  const getDashboardStats = useCallback(
    () => fetchWithAuth('/admin/dashboard/stats'),
    [fetchWithAuth]
  );

  // Produse
  const getProducts = useCallback(
    (params?: string) => fetchWithAuth<{
      products: any[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/admin/products${params ? `?${params}` : ''}`),
    [fetchWithAuth]
  );

  const getProduct = useCallback(
    (id: string) => fetchWithAuth<{ product: any }>(`/admin/products/${id}`),
    [fetchWithAuth]
  );

  const createProduct = useCallback(
    (data: unknown) =>
      fetchWithAuth<{ product: any }>('/admin/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  const updateProduct = useCallback(
    (id: string, data: unknown) =>
      fetchWithAuth<{ product: any }>(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  const deleteProduct = useCallback(
    (id: string) =>
      fetchWithAuth<{ success: boolean; softDeleted?: boolean; message?: string }>(
        `/admin/products/${id}?hard=true`,
        { method: 'DELETE' }
      ),
    [fetchWithAuth]
  );

  // Categorii
  const getCategories = useCallback(
    async () => {
      const data = await fetchWithAuth<any[]>('/admin/categories?includeInactive=true');
      // API returnează array direct, wrappăm pentru consistență
      return { categories: Array.isArray(data) ? data : [] };
    },
    [fetchWithAuth]
  );

  const getCategory = useCallback(
    (id: string) => fetchWithAuth<{ category: any }>(`/admin/categories/${id}`),
    [fetchWithAuth]
  );

  const createCategory = useCallback(
    (data: unknown) =>
      fetchWithAuth<{ category: any }>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  const updateCategory = useCallback(
    (id: string, data: unknown) =>
      fetchWithAuth<{ category: any }>(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  const deleteCategory = useCallback(
    (id: string) =>
      fetchWithAuth<{ success: boolean }>(`/admin/categories/${id}`, {
        method: 'DELETE',
      }),
    [fetchWithAuth]
  );

  // Comenzi
  const getOrders = useCallback(
    (params?: string) => fetchWithAuth<{
      orders: any[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/admin/orders${params ? `?${params}` : ''}`),
    [fetchWithAuth]
  );

  const getOrder = useCallback(
    (id: string) => fetchWithAuth<{ order: any }>(`/admin/orders/${id}`),
    [fetchWithAuth]
  );

  const updateOrderStatus = useCallback(
    (id: string, status: string, notes?: string) =>
      fetchWithAuth<{ order: any }>(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      }),
    [fetchWithAuth]
  );

  const updateOrder = useCallback(
    (id: string, data: { tableNumber?: string | null }) =>
      fetchWithAuth<{ order: any }>(`/admin/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  const getNewOrdersCount = useCallback(
    async (): Promise<number> => {
      try {
        const data = await fetchWithAuth<{
          orders: any[];
          pagination: { page: number; limit: number; total: number; pages: number };
        }>('/admin/orders?status=pending&limit=1');
        return data.pagination?.total || 0;
      } catch {
        return 0;
      }
    },
    [fetchWithAuth]
  );

  // Utilizatori
  const getUsers = useCallback(
    (params?: string) => fetchWithAuth<{
      users: any[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/admin/users${params ? `?${params}` : ''}`),
    [fetchWithAuth]
  );

  const getUser = useCallback(
    (id: string) => fetchWithAuth<{ user: any }>(`/admin/users/${id}`),
    [fetchWithAuth]
  );

  const updateUserRole = useCallback(
    (id: string, role: string) =>
      fetchWithAuth<{ user: any }>(`/admin/users/${id}/role`, {
        method: 'PUT',
        // Backend așteaptă array de roluri
        body: JSON.stringify({ roles: [role] }),
      }),
    [fetchWithAuth]
  );

  const toggleBlockUser = useCallback(
    (id: string, currentlyBlocked: boolean) =>
      fetchWithAuth<{ user: any }>(`/admin/users/${id}/block`, {
        method: 'PUT',
        body: JSON.stringify({ blocked: !currentlyBlocked }),
      }),
    [fetchWithAuth]
  );

  // Setări
  const getSettings = useCallback(
    () => fetchWithAuth<{ settings: any }>('/admin/settings'),
    [fetchWithAuth]
  );

  const updateSettings = useCallback(
    (data: unknown) =>
      fetchWithAuth<{ settings: any }>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  // Puncte loialitate
  const getPointsRewards = useCallback(
    (includeInactive?: boolean) =>
      fetchWithAuth<any[]>(
        `/admin/points/rewards${includeInactive ? '?includeInactive=true' : ''}`
      ),
    [fetchWithAuth]
  );

  const createPointsReward = useCallback(
    (data: { pointsCost: number; discountAmount: number }) =>
      fetchWithAuth<any>('/admin/points/rewards', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  const updatePointsReward = useCallback(
    (id: string, data: { pointsCost?: number; discountAmount?: number; isActive?: boolean }) =>
      fetchWithAuth<any>(`/admin/points/rewards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  const deletePointsReward = useCallback(
    (id: string) =>
      fetchWithAuth<{ success: boolean }>(`/admin/points/rewards/${id}`, {
        method: 'DELETE',
      }),
    [fetchWithAuth]
  );

  // Niveluri de loialitate (tiers)
  const getTiers = useCallback(
    () => fetchWithAuth<any[]>('/admin/tiers'),
    [fetchWithAuth]
  );

  const createTier = useCallback(
    (data: unknown) =>
      fetchWithAuth<any>('/admin/tiers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  const updateTier = useCallback(
    (id: string, data: unknown) =>
      fetchWithAuth<any>(`/admin/tiers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  const deleteTier = useCallback(
    (id: string) =>
      fetchWithAuth<{ success: boolean }>(`/admin/tiers/${id}`, {
        method: 'DELETE',
      }),
    [fetchWithAuth]
  );

  // Campanii streak
  const getStreakCampaigns = useCallback(
    () => fetchWithAuth<any[]>('/admin/streak/campaigns'),
    [fetchWithAuth]
  );

  const getStreakCampaign = useCallback(
    (id: string) => fetchWithAuth<any>(`/admin/streak/campaigns/${id}`),
    [fetchWithAuth]
  );

  const createStreakCampaign = useCallback(
    (data: unknown) =>
      fetchWithAuth<any>('/admin/streak/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  const updateStreakCampaign = useCallback(
    (id: string, data: unknown) =>
      fetchWithAuth<any>(`/admin/streak/campaigns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [fetchWithAuth]
  );

  const deleteStreakCampaign = useCallback(
    (id: string) =>
      fetchWithAuth<{ success: boolean }>(`/admin/streak/campaigns/${id}`, {
        method: 'DELETE',
      }),
    [fetchWithAuth]
  );

  const getStreakCampaignEnrollments = useCallback(
    (campaignId: string) =>
      fetchWithAuth<any[]>(`/admin/streak/campaigns/${campaignId}/enrollments`),
    [fetchWithAuth]
  );

  // Upload imagine
  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Eroare la încărcarea imaginii');
      }

      const data = await response.json();
      return data.url;
    },
    [token]
  );

  // Reguli add-on
  const getAddonRules = useCallback(
    () => fetchWithAuth<{ data: Record<string, string[]> }>('/admin/addon-rules'),
    [fetchWithAuth]
  );

  const getAddonRulesFull = useCallback(
    () =>
      fetchWithAuth<{
        data: Array<{
          id: number;
          categoryId: string;
          addonProductId: string;
          priority: number;
          timeStart: string | null;
          timeEnd: string | null;
          minCartValue: number | null;
        }>;
      }>('/admin/addon-rules/full'),
    [fetchWithAuth]
  );

  const updateAddonRules = useCallback(
    (rules: Record<string, string[]>) =>
      fetchWithAuth<{ data: Record<string, string[]> }>('/admin/addon-rules', {
        method: 'PUT',
        body: JSON.stringify({ rules }),
      }),
    [fetchWithAuth]
  );

  const updateAddonRulesFull = useCallback(
    (rulesFull: Array<{
      categoryId: string;
      addonProductId: string;
      priority?: number;
      timeStart?: string | null;
      timeEnd?: string | null;
      minCartValue?: number | null;
    }>) =>
      fetchWithAuth<{ success: boolean; dataFull?: unknown[] }>('/admin/addon-rules', {
        method: 'PUT',
        body: JSON.stringify({ rulesFull }),
      }),
    [fetchWithAuth]
  );

  return {
    // Dashboard
    getDashboard,
    getDashboardStats,
    // Produse
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    // Categorii
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    // Comenzi
    getOrders,
    getOrder,
    updateOrderStatus,
    updateOrder,
    getNewOrdersCount,
    // Utilizatori
    getUsers,
    getUser,
    updateUserRole,
    toggleBlockUser,
    // Setări
    getSettings,
    updateSettings,
    // Puncte
    getPointsRewards,
    createPointsReward,
    updatePointsReward,
    deletePointsReward,
    // Tiers
    getTiers,
    createTier,
    updateTier,
    deleteTier,
    // Streak
    getStreakCampaigns,
    getStreakCampaign,
    createStreakCampaign,
    updateStreakCampaign,
    deleteStreakCampaign,
    getStreakCampaignEnrollments,
    // Add-on rules
    getAddonRules,
    getAddonRulesFull,
    updateAddonRules,
    updateAddonRulesFull,
    // Upload
    uploadImage,
  };
};
