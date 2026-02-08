/**
 * Plugin Points - puncte loialitate
 * Punct de intrare pentru înregistrare
 */

import { Gift } from 'lucide-react';
import type { RouteObject } from 'react-router-dom';
import AdminPoints from './pages/AdminPoints';
import { PointsBalance } from './components/PointsBalance';
import { PointsCheckoutSelector } from './components/PointsCheckoutSelector';
import { PointsOrderBadge } from './components/PointsOrderBadge';
import { PointsOrderDetails } from './components/PointsOrderDetails';
import { usePointsRewards } from './hooks/usePointsRewards';

export { PointsBalance, PointsCheckoutSelector, PointsOrderBadge, PointsOrderDetails, usePointsRewards };
export { default as AdminPoints } from './pages/AdminPoints';
export type { PointsReward } from './types';
export { GET_POINTS_REWARDS } from './queries';

export const pointsPlugin = {
  /** Rute React Router pentru admin */
  routes: [
    { path: 'points', element: <AdminPoints /> },
  ] as RouteObject[],

  /** Elemente pentru sidebar admin */
  navItems: [
    { title: 'Puncte', url: '/admin/points', icon: Gift },
  ],

  /** Căi rute admin */
  routePaths: {
    adminPoints: '/admin/points',
  },

  /** componente */
  components: {
    PointsBalance,
    PointsCheckoutSelector,
    PointsOrderBadge,
    PointsOrderDetails,
  },

  /** hooks */
  hooks: {
    usePointsRewards,
  },
};
