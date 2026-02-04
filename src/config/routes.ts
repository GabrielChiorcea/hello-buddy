/**
 * Route configuration for the application
 * Centralized route paths for consistency
 */

export const routes = {
  home: '/',
  catalog: '/catalog',
  product: '/product/:id',
  cart: '/cart',
  checkout: '/checkout',
  profile: '/profile',
  login: '/login',
  signup: '/signup',
  orderSuccess: '/order-success',
  notFound: '*',
  // Admin routes
  adminLogin: '/admin/login',
  admin: '/admin',
  adminProducts: '/admin/products',
  adminCategories: '/admin/categories',
  adminOrders: '/admin/orders',
  adminUsers: '/admin/users',
  adminSettings: '/admin/settings',
} as const;

/**
 * Helper to generate product detail URL
 */
export const getProductUrl = (productId: string): string => {
  return `/product/${productId}`;
};

export type RouteKey = keyof typeof routes;
export type RoutePath = (typeof routes)[RouteKey];

/**
 * Protected routes that require authentication
 */
export const protectedRoutes: RoutePath[] = [
  routes.profile,
  routes.checkout,
];

/**
 * Auth routes (redirect to home if already logged in)
 */
export const authRoutes: RoutePath[] = [
  routes.login,
  routes.signup,
];

/**
 * Helper to check if a route is protected
 */
export const isProtectedRoute = (path: string): boolean => {
  return protectedRoutes.includes(path as RoutePath);
};

/**
 * Helper to check if a route is an auth route
 */
export const isAuthRoute = (path: string): boolean => {
  return authRoutes.includes(path as RoutePath);
};
