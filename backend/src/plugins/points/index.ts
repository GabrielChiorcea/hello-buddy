/**
 * Plugin Points - puncte loialitate
 * Punct de intrare pentru înregistrare
 */

import type { Router } from 'express';
import * as PointsService from './service.js';
import * as PointsHooks from './hooks.js';
import * as PointsAdminController from './admin/controller.js';
import { pointsSchemaExtension } from './graphql/schema.js';
import { pointsResolvers } from './graphql/resolvers.js';

export const service = PointsService;
export const hooks = PointsHooks;
export const schemaExtension = pointsSchemaExtension;
export const resolvers = pointsResolvers;

export const pointsPlugin = {
  service: PointsService,
  hooks: PointsHooks,
  schemaExtension,
  resolvers,
  registerAdminRoutes,
};

/**
 * Înregistrează rutele admin pentru puncte
 */
export function registerAdminRoutes(router: Router): void {
  router.get('/points/rewards', PointsAdminController.getRewards);
  router.post('/points/rewards', PointsAdminController.createReward);
  router.put('/points/rewards/:id', PointsAdminController.updateReward);
  router.delete('/points/rewards/:id', PointsAdminController.deleteReward);
}
