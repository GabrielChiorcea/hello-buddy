/**
 * Plugin Tiers - niveluri de loialitate bazate pe XP
 */

import { RouteObject } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import AdminTiers from './pages/AdminTiers';

export { default as AdminTiers } from './pages/AdminTiers';

export const tiersPlugin = {
  /** Rute React Router pentru admin */
  routes: [{ path: 'tiers', element: <AdminTiers /> }] as RouteObject[],

  /** Elemente pentru sidebar admin */
  navItems: [
    { title: 'Niveluri', url: '/admin/tiers', icon: Trophy },
  ],

  /** Căi rute admin */
  routePaths: {
    adminTiers: '/admin/tiers',
  },
};

