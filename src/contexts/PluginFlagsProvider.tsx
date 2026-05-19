import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PLUGIN_FLAGS } from '@/graphql/queries';
import {
  PLUGIN_KEYS,
  type PluginKey,
  toSettingId,
  parsePluginEnabled,
} from '@/config/pluginFlags';

export type PluginFlagsQueryData = {
  plugin_points_enabled: string | null;
  plugin_streak_enabled: string | null;
  plugin_welcome_bonus_enabled: string | null;
  plugin_addons_enabled: string | null;
  plugin_tiers_enabled: string | null;
  plugin_free_products_enabled: string | null;
  plugin_coupons_enabled: string | null;
  plugin_gamification_toasts_enabled: string | null;
};

type PluginFlagsContextValue = {
  flags: Record<PluginKey, boolean>;
  loading: boolean;
};

const defaultFlags = PLUGIN_KEYS.reduce(
  (acc, key) => {
    acc[key] = true;
    return acc;
  },
  {} as Record<PluginKey, boolean>,
);

const PluginFlagsContext = createContext<PluginFlagsContextValue | null>(null);

function buildFlagsFromQuery(data: PluginFlagsQueryData | undefined): Record<PluginKey, boolean> {
  if (!data) return { ...defaultFlags };

  return PLUGIN_KEYS.reduce(
    (acc, key) => {
      const settingId = toSettingId(key) as keyof PluginFlagsQueryData;
      acc[key] = parsePluginEnabled(data[settingId]);
      return acc;
    },
    {} as Record<PluginKey, boolean>,
  );
}

export function PluginFlagsProvider({ children }: { children: React.ReactNode }) {
  const { data, loading } = useQuery<PluginFlagsQueryData>(GET_PLUGIN_FLAGS, {
    fetchPolicy: 'cache-first',
  });

  const value = useMemo(
    () => ({
      flags: buildFlagsFromQuery(data),
      loading,
    }),
    [data, loading],
  );

  return <PluginFlagsContext.Provider value={value}>{children}</PluginFlagsContext.Provider>;
}

export function usePluginFlagsContext(): PluginFlagsContextValue {
  const ctx = useContext(PluginFlagsContext);
  if (!ctx) {
    throw new Error('usePluginFlagsContext must be used within PluginFlagsProvider');
  }
  return ctx;
}
