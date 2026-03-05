/**
 * Router pentru panoul de administrare
 * Include rate limiting pentru autentificare admin
 */

import { Router, RequestHandler } from 'express';
import { requireAdmin } from '../middleware/adminAuth.js';

// Importă controllere
import * as dashboardController from './controllers/dashboard.js';
import * as productsController from './controllers/products.js';
import * as categoriesController from './controllers/categories.js';
import * as ordersController from './controllers/orders.js';
import * as usersController from './controllers/users.js';
import * as settingsController from './controllers/settings.js';
import * as authController from './controllers/auth.js';
import { pointsPlugin } from '../plugins/points/index.js';
import { streakPlugin } from '../plugins/streak/index.js';
import * as addonsController from './controllers/addons.js';

export type AdminRateLimiters = {
  adminAuthLimiter: RequestHandler;
  refreshLimiter: RequestHandler;
  orderLimiter: RequestHandler;
};

export function createAdminRouter(limiters: AdminRateLimiters) {
  const router = Router();

  // ============================================
  // Rute publice (autentificare admin) cu rate limiting strict
  // ============================================
  router.post('/auth/login', limiters.adminAuthLimiter, authController.login);
  router.post('/auth/refresh', limiters.refreshLimiter, authController.refreshToken);
router.post('/auth/logout', authController.logout);

// ============================================
// Toate rutele de mai jos necesită autentificare admin
// ============================================
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);
router.get('/dashboard/stats', dashboardController.getStats);

// Produse
router.get('/products', productsController.getProducts);
router.get('/products/:id', productsController.getProduct);
router.post('/products', productsController.createProduct);
router.put('/products/:id', productsController.updateProduct);
router.delete('/products/:id', productsController.deleteProduct);

// Categorii
router.get('/categories', categoriesController.getCategories);
router.get('/categories/:id', categoriesController.getCategory);
router.post('/categories', categoriesController.createCategory);
router.put('/categories/:id', categoriesController.updateCategory);
router.put('/categories/order', categoriesController.reorderCategories);
router.delete('/categories/:id', categoriesController.deleteCategory);

// Comenzi - cu rate limiting pentru actualizări
router.get('/orders', ordersController.getOrders);
router.get('/orders/export', ordersController.exportOrders);
router.get('/orders/:id', ordersController.getOrder);
router.put('/orders/:id/status', ordersController.updateOrderStatus);
router.put('/orders/:id', ordersController.updateOrder);

// Utilizatori
router.get('/users', usersController.getUsers);
router.get('/users/:id', usersController.getUser);
router.put('/users/:id/role', usersController.updateUserRole);
router.put('/users/:id/block', usersController.toggleBlockUser);

// Setări
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);

// Puncte loialitate (plugin)
pointsPlugin.registerAdminRoutes(router);
// Campanii streak (plugin)
streakPlugin.registerAdminRoutes(router);

// Reguli add-on per categorie
router.get('/addon-rules/full', addonsController.getAddonRulesFull);
router.get('/addon-rules', addonsController.getAddonRules);
router.put('/addon-rules', addonsController.updateAddonRules);

  return router;
}
