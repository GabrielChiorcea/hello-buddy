/**
 * Rezolvere GraphQL pentru puncte
 * Plugin: plugins/points
 */

import * as PointsModel from '../model.js';
import { queryOne } from '../../../config/database.js';

export const pointsResolvers = {
  Query: {
    /**
     * Praguri puncte pentru checkout (doar cele active)
     * Returnează [] dacă plugin-ul este dezactivat
     */
    async pointsRewards(): Promise<PointsModel.PointsReward[]> {
      const row = await queryOne<{ value: string }>(
        "SELECT value FROM app_settings WHERE id = 'plugin_points_enabled'",
        []
      );
      if (row && (row.value === 'false' || row.value === '0')) {
        return [];
      }
      return PointsModel.getRewards(false);
    },
  },
};
