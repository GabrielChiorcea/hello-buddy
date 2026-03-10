/**
 * MobileBottomNav — Dispatcher care alege varianta vizuală
 * în funcție de stilul configurat la build-time în src/config/themes/styles.ts
 */

import React from 'react';
import { useNavbarStyle } from '@/config/themes/styles';
import { useMobileNavData } from './mobileNavStyles/shared';
import { GamifiedMobileNav } from './mobileNavStyles/gamifiedMobileNav';
import { CleanMobileNav } from './mobileNavStyles/cleanMobileNav';
import { PremiumMobileNav } from './mobileNavStyles/premiumMobileNav';
import { FriendlyMobileNav } from './mobileNavStyles/friendlyMobileNav';

const MOBILE_NAV_VARIANTS = {
  gamified: GamifiedMobileNav,
  clean: CleanMobileNav,
  premium: PremiumMobileNav,
  friendly: FriendlyMobileNav,
} as const;

const MobileBottomNav: React.FC = () => {
  const style = useNavbarStyle();
  const data = useMobileNavData();
  const Variant = MOBILE_NAV_VARIANTS[style];

  return <Variant data={data} />;
};

export { MobileBottomNav };
