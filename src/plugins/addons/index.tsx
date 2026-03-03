/**
 * Plugin Add-ons – feature flag: plugin_addons_enabled
 * Secțiunea "Adaugă la comandă" în coș (sugestii pe categorii).
 * Pe viitor: reguli per produs, add-on gratuite cu puncte.
 */

import React from 'react';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { CartAddonSection } from './CartAddonSection';

export const CartAddonSectionWrapped: React.FC = () => {
  const { enabled, loading } = usePluginEnabled('addons');
  if (loading || !enabled) return null;
  return <CartAddonSection />;
};

export { CartAddonSection } from './CartAddonSection';
