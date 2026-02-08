/**
 * Rezolvere GraphQL pentru puncte
 * Plugin: plugins/points
 */

import * as PointsModel from '../model.js';

export const pointsResolvers = {
  Query: {
    /**
     * Praguri puncte pentru checkout (doar cele active)
     */
    async pointsRewards(): Promise<PointsModel.PointsReward[]> {
      return PointsModel.getRewards(false);
    },
  },
};
