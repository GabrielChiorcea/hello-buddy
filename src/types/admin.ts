/**
 * =============================================================================
 * TIPURI PENTRU PANOUL DE ADMINISTRARE
 * =============================================================================
 */

import { Order, Product, User } from './index';

// =============================================================================
// TIPURI AUTENTIFICARE ADMIN
// =============================================================================

export type AdminRole = 'admin' | 'moderator' | 'user';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

// =============================================================================
// TIPURI DASHBOARD
// =============================================================================

export interface DashboardStats {
  today: {
    orders: number;
    revenue: number;
    newUsers: number;
  };
  thisWeek: {
    orders: number;
    revenue: number;
  };
  thisMonth: {
    orders: number;
    revenue: number;
  };
}

export interface OrdersByStatus {
  pending: number;
  confirmed: number;
  preparing: number;
  delivering: number;
  delivered: number;
  cancelled: number;
}

export interface TopProduct {
  product: Product;
  ordersCount: number;
  revenue: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: Order[];
  topProducts: TopProduct[];
  ordersByStatus: OrdersByStatus;
  salesChart: { date: string; revenue: number; orders: number }[];
}

// =============================================================================
// TIPURI PAGINARE ȘI FILTRE
// =============================================================================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  isAvailable?: boolean;
}

export interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface UserFilters {
  search?: string;
  role?: AdminRole;
  isBlocked?: boolean;
}

// =============================================================================
// TIPURI RĂSPUNSURI API ADMIN
// =============================================================================

export interface AdminProductsResponse {
  products: Product[];
  pagination: Pagination;
}

export interface AdminOrdersResponse {
  orders: Order[];
  pagination: Pagination;
}

export interface AdminUsersResponse {
  users: (User & { role: AdminRole; isBlocked: boolean; ordersCount: number })[];
  pagination: Pagination;
}

// =============================================================================
// TIPURI CATEGORII
// =============================================================================

export interface Category {
  id: string;
  name: string;
  displayName: string;
  image?: string;
  sortOrder: number;
  productsCount: number;
}

// =============================================================================
// TIPURI SETĂRI
// =============================================================================

export interface AppSettings {
  deliveryFee: number;
  minOrderAmount: number;
  openingHours: string;
  closingHours: string;
  isOpen: boolean;
  maintenanceMode: boolean;
  contactEmail: string;
  contactPhone: string;
}
