import React from 'react';
import { BellRing } from 'lucide-react';
import type { RouteObject } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { GamificationToastsGate } from './GamificationToastsGate';
import AdminGamificationToasts from '@/admin/pages/AdminGamificationToasts';

export const GamificationToastsGateWrapped: React.FC = () => {
  const { pathname } = useLocation();
  const { enabled, loading } = usePluginEnabled('gamification_toasts');
  if (pathname.startsWith('/admin')) return null;
  if (pathname === '/') return null;
  if (loading || !enabled) return null;
  return <GamificationToastsGate />;
};

export { GamificationToastsGate };
export { default as AdminGamificationToasts } from '@/admin/pages/AdminGamificationToasts';

export const gamificationToastsPlugin = {
  routes: [{ path: 'gamification-toasts', element: <AdminGamificationToasts /> }] as RouteObject[],
  navItems: [{ title: 'Gamification Toasts', url: '/admin/gamification-toasts', icon: BellRing }],
  routePaths: {
    adminGamificationToasts: '/admin/gamification-toasts',
  },
  components: {
    GamificationToastsGate,
    GamificationToastsGateWrapped,
  },
};
