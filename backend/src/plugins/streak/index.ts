/**
 * Plugin Streak - campanii streak
 * Punct de intrare pentru înregistrare
 */

import type { Router } from 'express';
import * as StreakService from './service.js';
import * as StreakHooks from './hooks.js';
import * as StreakAdminController from './admin/controller.js';
import { streakSchemaExtension } from './graphql/schema.js';
import { streakResolvers } from './graphql/resolvers.js';

export const service = StreakService;
export const hooks = StreakHooks;
export const schemaExtension = streakSchemaExtension;
export const resolvers = streakResolvers;
export { streakResolvers };

export const streakPlugin = {
  service: StreakService,
  hooks: StreakHooks,
  schemaExtension,
  resolvers,
  registerAdminRoutes,
};

export function registerAdminRoutes(router: Router): void {
  router.get('/streak/campaigns', StreakAdminController.getCampaigns);
  router.get('/streak/campaigns/:id', StreakAdminController.getCampaign);
  router.post('/streak/campaigns', StreakAdminController.createCampaign);
  router.put('/streak/campaigns/:id', StreakAdminController.updateCampaign);
  router.delete('/streak/campaigns/:id', StreakAdminController.deleteCampaign);
  router.get('/streak/campaigns/:id/enrollments', StreakAdminController.getCampaignEnrollments);
}
