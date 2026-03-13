/**
 * Plugin Free Products - campanii de produse gratuite pe rank (tiers)
 * Punct de intrare pentru înregistrare în admin.
 */

import type { Router } from 'express';
import * as FreeProductsAdminController from './admin/controller.js';

export const freeProductsPlugin = {
  registerAdminRoutes,
};

export function registerAdminRoutes(router: Router): void {
  router.get('/free-products/campaigns', FreeProductsAdminController.getCampaigns);
  router.get('/free-products/campaigns/:id', FreeProductsAdminController.getCampaign);
  router.post('/free-products/campaigns', FreeProductsAdminController.createCampaign);
  router.put('/free-products/campaigns/:id', FreeProductsAdminController.updateCampaign);
  router.delete('/free-products/campaigns/:id', FreeProductsAdminController.deleteCampaign);
}

