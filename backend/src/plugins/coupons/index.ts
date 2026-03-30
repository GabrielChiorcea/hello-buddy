import type { Router } from 'express';
import * as CouponsAdminController from './admin/controller.js';
import { couponsSchemaExtension } from './graphql/schema.js';
import { couponsResolvers } from './graphql/resolvers.js';
import * as CouponsService from './service.js';

export const service = CouponsService;
export const schemaExtension = couponsSchemaExtension;
export const resolvers = couponsResolvers;

export const couponsPlugin = {
  service,
  schemaExtension,
  resolvers,
  registerAdminRoutes,
};

export function registerAdminRoutes(router: Router): void {
  router.get('/coupons', CouponsAdminController.getCoupons);
  router.post('/coupons', CouponsAdminController.createCoupon);
  router.put('/coupons/:id', CouponsAdminController.updateCoupon);
  router.delete('/coupons/:id', CouponsAdminController.deleteCoupon);
  router.get('/coupons/analytics', CouponsAdminController.getCouponsAnalytics);
}

