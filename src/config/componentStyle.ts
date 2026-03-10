/**
 * ═══ Backward Compatibility ═══
 *
 * Importurile vechi funcționează în continuare.
 * Configurarea centralizată se face în src/config/themes/styles.ts
 */

export type { StyleName as ComponentStyleName } from './themes/styles';

export {
  STYLES,
  useComponentStyle,
  useTierStyle,
  ComponentStyleProvider,
  TierStyleProvider,
  useProductCardStyle,
  ProductCardStyleProvider,
  useNavbarStyle,
  NavbarStyleProvider,
} from './themes/styles';

import { STYLES } from './themes/styles';

export const DEFAULT_COMPONENT_STYLE = STYLES.component;
export const DEFAULT_TIER_STYLE = STYLES.tier;
