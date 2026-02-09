/**
 * Rezolvere GraphQL pentru puncte
 * Plugin: plugins/points
 */

import * as PointsModel from '../model.js';
import { isPluginEnabled } from '../../../utils/pluginFlags.js';

export const pointsResolvers = {
  Query: {
    /**
     * Praguri puncte pentru checkout (doar cele active)
     * Returnează [] dacă plugin-ul este dezactivat
     */
    async pointsRewards(): Promise<PointsModel.PointsReward[]> {
      const enabled = await isPluginEnabled('points');
      if (!enabled) return [];
      return PointsModel.getRewards(false);
    },
  },
};
