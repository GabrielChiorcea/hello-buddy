/**
 * Helper centralizat pentru verificare feature flags plugin-uri
 * Evită duplicarea logicii de citire din app_settings
 */

import { queryOne } from '../config/database.js';

/**
 * Verifică dacă un plugin este activat
 * Returnează true dacă setarea nu există (activat implicit)
 */
export async function isPluginEnabled(pluginKey: string): Promise<boolean> {
  const settingKey = `plugin_${pluginKey}_enabled`;
  const row = await queryOne<{ value: string }>(
    'SELECT value FROM app_settings WHERE id = ?',
    [settingKey]
  );
  // Dacă setarea nu există, plugin-ul este activat implicit
  if (!row) return true;
  return row.value !== 'false' && row.value !== '0';
}
