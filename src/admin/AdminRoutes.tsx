/**
 * Rute admin — încărcate lazy doar când utilizatorul intră pe /admin/*
 */
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PageLoader } from '@/components/common/Loader';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { AdminLayout } from './components/AdminLayout';

const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/AdminCategories'));
const AdminProductOptions = lazy(() => import('./pages/AdminProductOptions'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminWelcomeBonus = lazy(() => import('./pages/AdminWelcomeBonus'));
const AdminAddonRules = lazy(() => import('./pages/AdminAddonRules'));
const AdminFreeProductCampaigns = lazy(() => import('./pages/AdminFreeProductCampaigns'));
const AdminCoupons = lazy(() => import('./pages/AdminCoupons'));
const AdminPoints = lazy(() => import('@/plugins/points/pages/AdminPoints'));
const AdminStreakCampaigns = lazy(() => import('@/plugins/streak/pages/AdminStreakCampaigns'));
const AdminTiers = lazy(() => import('@/plugins/tiers/pages/AdminTiers'));
const AdminGamificationToasts = lazy(() => import('./pages/AdminGamificationToasts'));

function AdminRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="points" element={<AdminPoints />} />
          <Route path="welcome-bonus" element={<AdminWelcomeBonus />} />
          <Route path="streak" element={<AdminStreakCampaigns />} />
          <Route path="tiers" element={<AdminTiers />} />
          <Route path="free-products" element={<AdminFreeProductCampaigns />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="addon-rules" element={<AdminAddonRules />} />
          <Route path="product-options" element={<AdminProductOptions />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="gamification-toasts" element={<AdminGamificationToasts />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AdminRoutes;
