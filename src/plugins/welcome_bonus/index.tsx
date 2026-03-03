/**
 * Plugin Welcome Bonus – puncte cadou la prima autentificare (popup + alocare)
 * Feature flag: plugin_welcome_bonus_enabled
 */

import React from 'react';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { WelcomeBonusGate } from './WelcomeBonusGate';

/** Montare în App: afișează gate-ul doar când plugin-ul este activat */
export const WelcomeBonusGateWrapped: React.FC = () => {
  const { enabled, loading } = usePluginEnabled('welcome_bonus');
  if (loading || !enabled) return null;
  return <WelcomeBonusGate />;
};

export { WelcomeBonusGate } from './WelcomeBonusGate';
export { WelcomeBonusModal } from './WelcomeBonusModal';
