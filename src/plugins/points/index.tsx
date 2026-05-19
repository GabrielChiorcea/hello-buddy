/**
 * Plugin Points — componente user (fără pagini admin; admin → AdminRoutes lazy)
 */

import { PointsBalance } from './components/PointsBalance';
import { PointsCheckoutSelector } from './components/PointsCheckoutSelector';
import { PointsOrderBadge } from './components/PointsOrderBadge';
import { PointsOrderDetails } from './components/PointsOrderDetails';
import { usePointsRewards } from './hooks/usePointsRewards';

export { PointsBalance, PointsCheckoutSelector, PointsOrderBadge, PointsOrderDetails, usePointsRewards };
export type { PointsReward } from './types';
export { GET_POINTS_REWARDS } from './queries';

export const pointsPlugin = {
  routePaths: {
    adminPoints: '/admin/points',
  },
  components: {
    PointsBalance,
    PointsCheckoutSelector,
    PointsOrderBadge,
    PointsOrderDetails,
  },
  hooks: {
    usePointsRewards,
  },
};
