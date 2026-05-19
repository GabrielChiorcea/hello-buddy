/**
 * Verifică dacă un plugin este activat (citește din PluginFlagsProvider — un singur request GraphQL).
 */

import { usePluginFlagsContext } from '@/contexts/PluginFlagsProvider';
import type { PluginKey } from '@/config/pluginFlags';

/**
 * Verifică dacă un plugin este activat
 * Returnează enabled: false în timpul încărcării inițiale a flag-urilor
 */
export function usePluginEnabled(pluginKey: string): { enabled: boolean; loading: boolean } {
  const { flags, loading } = usePluginFlagsContext();

  if (loading) return { enabled: false, loading: true };

  const key = pluginKey as PluginKey;
  const enabled = flags[key] ?? true;

  return { enabled, loading: false };
}
