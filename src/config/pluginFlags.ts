/**
 * Feature flags plugin — chei app_settings (plugin_{key}_enabled)
 */

export const PLUGIN_KEYS = [
  'points',
  'streak',
  'welcome_bonus',
  'addons',
  'tiers',
  'free_products',
  'coupons',
  'gamification_toasts',
] as const;

export type PluginKey = (typeof PLUGIN_KEYS)[number];

export function toSettingId(key: PluginKey): string {
  return `plugin_${key}_enabled`;
}

/** null/undefined în DB → activ implicit (compatibil cu usePluginEnabled vechi) */
export function parsePluginEnabled(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return value === 'true' || value === '1';
}
