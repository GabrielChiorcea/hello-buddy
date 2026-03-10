/**
 * =============================================================================
 * COMPONENTA PRINCIPALĂ A APLICAȚIEI
 * =============================================================================
 *
 * 
 * App.tsx este punctul central al aplicației React.
 * 
 * Funcționalități:
 * - Configurează provider-ii pentru state management (Redux, Apollo, TanStack Query)
 * - Definește rutele aplicației cu React Router
 * - Gestionează refresh-ul automat al token-urilor JWT
 * - Configurează componentele globale (Toaster, Tooltip)
 * 
 * Ordinea provider-ilor:
 * 1. ApolloProvider - pentru GraphQL
 * 2. Redux Provider - pentru state management local
 * 3. QueryClientProvider - pentru TanStack Query
 * 4. TooltipProvider - pentru tooltip-uri UI
 * 
 * NOTĂ IMPORTANTĂ - GESTIONARE TOKEN-URI:
 * Token-urile JWT sunt stocate DOAR în memorie (Redux), nu în localStorage.
 * La refresh pagină, utilizatorul trebuie să se re-autentifice.
 * =============================================================================
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WelcomeBonusGateWrapped } from "@/plugins/welcome_bonus";
import { Provider } from "react-redux";
import { store } from "@/store";
import { routes } from "@/config/routes";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import { useSessionRestore } from "@/hooks/useSessionRestore";

// Import Apollo Provider
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/graphql/client";
import { ComponentStyleProvider, DEFAULT_COMPONENT_STYLE, TierStyleProvider, DEFAULT_TIER_STYLE } from "./config/componentStyle";

// ============================================================================
// IMPORTURI PAGINI
// ============================================================================

import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Catalog from "./pages/Catalog";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Terms from "./pages/Terms";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// ============================================================================
// IMPORTURI ADMIN
// ============================================================================

import { AdminLayout } from "./admin/components/AdminLayout";
import { AdminProtectedRoute } from "./admin/components/AdminProtectedRoute";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminCategories from "./admin/pages/AdminCategories";
import AdminOrders from "./admin/pages/AdminOrders";
import AdminUsers from "./admin/pages/AdminUsers";
import { AdminPoints } from "./plugins/points";
import { AdminStreakCampaigns } from "./plugins/streak";
import { AdminTiers } from "./plugins/tiers";
import AdminSettings from "./admin/pages/AdminSettings";
import AdminAnalytics from "./admin/pages/AdminAnalytics";
import AdminAddonRules from "./admin/pages/AdminAddonRules";

// ============================================================================
// CONFIGURARE QUERY CLIENT
// ============================================================================

/**
 * Instanța TanStack Query Client
 * Folosit pentru cache-ing și state management al cererilor asincrone
 */
const queryClient = new QueryClient();

// ============================================================================
// COMPONENTA DE GESTIONARE TOKEN-URI JWT
// ============================================================================

/**
 * TokenRefreshHandler - Componentă internă pentru gestionarea token-urilor
 * 
 * Funcționalități:
 * - Verifică periodic expirarea token-ului
 * - Reînnoiește automat token-ul înainte de expirare
 * - Deconectează utilizatorul dacă refresh-ul eșuează
 * 
 * NOTĂ: Token-urile sunt stocate DOAR în Redux (memorie), nu în localStorage!
 */
const TokenRefreshHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Restaurează sesiunea la încărcare
  useSessionRestore();
  // Hook-ul gestionează refresh-ul automat al token-urilor
  useTokenRefresh();
  return <>{children}</>;
};

// ============================================================================
// COMPONENTA PRINCIPALĂ
// ============================================================================

/**
 * App - Componenta rădăcină a aplicației
 * 
 * Structura ierarhică a provider-ilor:
 * ApolloProvider -> Redux Provider -> QueryClientProvider -> TooltipProvider -> Routes
 */
const App = () => (
  <ApolloProvider client={apolloClient}>
    <Provider store={store}>
      <ComponentStyleProvider value={DEFAULT_COMPONENT_STYLE}>
      <TierStyleProvider value={DEFAULT_TIER_STYLE}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* Componente globale pentru notificări */}
          <Toaster />
          <Sonner />
          
          {/* Router pentru navigare */}
          <BrowserRouter>
            {/* Scroll la top la schimbarea rutei */}
            <ScrollToTop />
            
            {/* Gestionare refresh token-uri JWT */}
            <TokenRefreshHandler>
              {/* Modal cadou puncte la prima autentificare */}
              <WelcomeBonusGateWrapped />
              {/* Error Boundary - prinde erori React și afișează fallback */}
              <ErrorBoundary>
                <Routes>
                {/* Pagini publice */}
                <Route path={routes.welcome} element={<Welcome />} />
                <Route path={routes.home} element={<Home />} />
                <Route path={routes.login} element={<Login />} />
                <Route path={routes.signup} element={<Signup />} />
                <Route path={routes.forgotPassword} element={<ForgotPassword />} />
                <Route path={routes.resetPassword} element={<ResetPassword />} />
                <Route path={routes.terms} element={<Terms />} />
                <Route path={routes.catalog} element={<Catalog />} />
                <Route path={routes.product} element={<ProductDetails />} />
                <Route path={routes.cart} element={<Cart />} />
                
                {/* Pagini care necesită autentificare */}
                <Route path={routes.checkout} element={<Checkout />} />
                <Route path={routes.checkoutSuccess} element={<CheckoutSuccess />} />
                <Route path={routes.profile} element={<Profile />} />

                {/* Rute Admin Panel */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
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
                  <Route path="streak" element={<AdminStreakCampaigns />} />
                  <Route path="tiers" element={<AdminTiers />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="addon-rules" element={<AdminAddonRules />} />
                </Route>
                
                {/* Rută catch-all pentru 404 */}
                {/* IMPORTANT: Toate rutele personalizate trebuie adăugate DEASUPRA acestei rute */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </TokenRefreshHandler>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
      </TierStyleProvider>
      </ComponentStyleProvider>
    </Provider>
  </ApolloProvider>
);

export default App;
