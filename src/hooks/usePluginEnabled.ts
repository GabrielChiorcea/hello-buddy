/**
 * Hook pentru verificare feature flag plugin
 * Verifică dacă un plugin este activat prin app_settings din backend
 */

import { useQuery, gql } from '@apollo/client';

const GET_APP_SETTING = gql`
  query GetAppSetting($key: String!) {
    appSetting(key: $key)
  }
`;

/**
 * Verifică dacă un plugin este activat
 * Returnează true dacă setarea nu există (activat implicit)
 */
export function usePluginEnabled(pluginKey: string): { enabled: boolean; loading: boolean } {
  const settingKey = `plugin_${pluginKey}_enabled`;
  const { data, loading } = useQuery<{ appSetting: string | null }>(GET_APP_SETTING, {
    variables: { key: settingKey },
    fetchPolicy: 'cache-first',
  });

  // Dacă nu s-a încărcat sau setarea nu există, considerăm plugin-ul activat (implicit)
  if (loading) return { enabled: false, loading: true };

  const value = data?.appSetting;
  // Dacă setarea nu există (null), plugin-ul este activat implicit
  if (value === null || value === undefined) return { enabled: true, loading: false };

  return { enabled: value === 'true' || value === '1', loading: false };
}
