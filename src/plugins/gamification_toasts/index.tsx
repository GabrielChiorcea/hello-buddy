import React from 'react';
import { useLocation } from 'react-router-dom';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { GamificationToastsGate } from './GamificationToastsGate';

export const GamificationToastsGateWrapped: React.FC = () => {
  const { pathname } = useLocation();
  const { enabled, loading } = usePluginEnabled('gamification_toasts');
  if (pathname.startsWith('/admin')) return null;
  if (pathname === '/') return null;
  if (loading || !enabled) return null;
  return <GamificationToastsGate />;
};

export { GamificationToastsGate };

export const gamificationToastsPlugin = {
  routePaths: {
    adminGamificationToasts: '/admin/gamification-toasts',
  },
  components: {
    GamificationToastsGate,
    GamificationToastsGateWrapped,
  },
};
