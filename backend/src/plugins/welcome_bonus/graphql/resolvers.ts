/**
 * GraphQL resolvers for welcome bonus plugin
 * Plugin: plugins/welcome_bonus
 */

import { GraphQLContext, requireAuth } from '../../../graphql/context.js';
import * as UserModel from '../../../models/User.js';
import { queryOne } from '../../../config/database.js';
import { isPluginEnabled } from '../../../utils/pluginFlags.js';
import type { User } from '../../../models/User.js';

export const welcomeBonusResolvers = {
  Mutation: {
    async markWelcomeBonusSeen(_: unknown, __: unknown, context: GraphQLContext) {
      const enabled = await isPluginEnabled('welcome_bonus');
      if (!enabled) return true;
      const user = requireAuth(context);
      await UserModel.markWelcomeBonusSeen(user.id);
      return true;
    },
  },

  User: {
    async welcomeBonusAmount(user: User): Promise<number> {
      const enabled = await isPluginEnabled('welcome_bonus');
      if (!enabled) return 0;
      if (user.welcomeBonusSeen) return 0;
      const pointsEnabled = await isPluginEnabled('points');
      if (!pointsEnabled) return 0;
      const row = await queryOne<{ value: string }>(
        "SELECT value FROM app_settings WHERE id = 'points_welcome_bonus'"
      );
      if (!row) return 5;
      return Math.max(0, parseInt(row.value, 10) || 0);
    },
  },
};
