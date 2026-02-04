/**
 * =============================================================================
 * EXPORTURI COMPONENTE ADMIN
 * =============================================================================
 */

// Componente
export { AdminLayout } from './components/AdminLayout';
export { AdminSidebar } from './components/AdminSidebar';
export { AdminHeader } from './components/AdminHeader';
export { AdminProtectedRoute } from './components/AdminProtectedRoute';
export { DataTable } from './components/DataTable';
export { StatsCard } from './components/StatsCard';

// Hooks
export { useAdminApi } from './hooks/useAdminApi';

// Pagini
export { default as AdminLogin } from './pages/AdminLogin';
export { default as AdminDashboard } from './pages/AdminDashboard';
export { default as AdminProducts } from './pages/AdminProducts';
export { default as AdminCategories } from './pages/AdminCategories';
export { default as AdminOrders } from './pages/AdminOrders';
export { default as AdminUsers } from './pages/AdminUsers';
export { default as AdminSettings } from './pages/AdminSettings';
