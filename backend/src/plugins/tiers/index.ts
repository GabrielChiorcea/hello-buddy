/**
 * Plugin Tiers - niveluri de loialitate bazate pe XP
 * Punct de intrare pentru înregistrare
 */

import type { Router } from 'express';
import * as TiersService from './service.js';
import * as TiersHooks from './hooks.js';
import * as TiersAdminController from './admin/controller.js';
import { tiersSchemaExtension } from './graphql/schema.js';
import { tiersResolvers } from './graphql/resolvers.js';

export const service = TiersService;
export const hooks = TiersHooks;
export const schemaExtension = tiersSchemaExtension;
export const resolvers = tiersResolvers;
export { tiersResolvers };

export const tiersPlugin = {
  service: TiersService,
  hooks: TiersHooks,
  schemaExtension,
  resolvers,
  registerAdminRoutes,
};

export function registerAdminRoutes(router: Router): void {
  router.get('/tiers', TiersAdminController.getTiers);
  router.post('/tiers', TiersAdminController.createTier);
  router.put('/tiers/:id', TiersAdminController.updateTier);
  router.delete('/tiers/:id', TiersAdminController.deleteTier);
}

