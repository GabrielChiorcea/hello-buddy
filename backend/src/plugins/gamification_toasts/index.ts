/**
 * Plugin Gamification Toasts
 * Punct de intrare backend standardizat.
 */

import type { Router } from 'express';
import * as GamificationToastsService from './service.js';
import * as GamificationToastsAdminController from './admin/controller.js';
import { gamificationToastsSchemaExtension } from './graphql/schema.js';
import { gamificationToastsResolvers } from './graphql/resolvers.js';

export const service = GamificationToastsService;
export const schemaExtension = gamificationToastsSchemaExtension;
export const resolvers = gamificationToastsResolvers;

export const gamificationToastsPlugin = {
  service: GamificationToastsService,
  schemaExtension,
  resolvers,
  registerAdminRoutes,
};

export function registerAdminRoutes(router: Router): void {
  router.get('/gamification-toasts/items', GamificationToastsAdminController.getItems);
  router.put('/gamification-toasts/items', GamificationToastsAdminController.updateItems);
}
