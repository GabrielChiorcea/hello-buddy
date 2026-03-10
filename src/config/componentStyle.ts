/**
 * ═══ Backward Compatibility ═══
 *
 * Configurarea centralizată se face în src/config/themes/index.ts
 */

export type { StyleName as ComponentStyleName } from './themes';

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
  useCartStyle,
  CartStyleProvider,
  useCheckoutStyle,
  CheckoutStyleProvider,
  useHomeStyle,
  HomeStyleProvider,
  useFooterStyle,
  FooterStyleProvider,
} from './themes';

import { STYLES } from './themes';

export const DEFAULT_COMPONENT_STYLE = STYLES.component;
export const DEFAULT_TIER_STYLE = STYLES.tier;
