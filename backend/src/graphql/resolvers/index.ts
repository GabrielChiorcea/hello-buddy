/**
 * Export și combinare toate rezolverele GraphQL
 */

import { authResolvers } from './auth.js';
import { productResolvers } from './product.js';
import { userResolvers } from './user.js';
import { addressResolvers } from './address.js';
import { orderResolvers } from './order.js';
import { paymentResolvers } from './payment.js';
import { resolvers as pointsResolvers } from '../../plugins/points/index.js';
import { streakResolvers } from '../../plugins/streak/index.js';
import { queryOne } from '../../config/database.js';

// Combină toate rezolverele
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resolvers: any = {
  Query: {
    ...productResolvers.Query,
    ...userResolvers.Query,
    ...addressResolvers.Query,
    ...orderResolvers.Query,
    ...pointsResolvers.Query,
    ...streakResolvers.Query,

    /**
     * Returnează valoarea unei setări din app_settings
     * Folosit pentru feature flags (ex: plugin_points_enabled)
     */
    async appSetting(_: unknown, { key }: { key: string }): Promise<string | null> {
      const row = await queryOne<{ value: string }>(
        'SELECT value FROM app_settings WHERE id = ?',
        [key]
      );
      return row ? row.value : null;
    },
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...addressResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...paymentResolvers.Mutation,
    ...streakResolvers.Mutation,
  },
  // Field resolvers
  Product: productResolvers.Product,
  Order: orderResolvers.Order,
  User: userResolvers.User,
};
