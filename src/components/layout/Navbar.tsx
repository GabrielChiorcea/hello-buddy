/**
 * Navbar — Dispatcher care alege varianta vizuală
 * în funcție de stilul configurat la build-time în src/config/themes/styles.ts
 */

import React from 'react';
import { useNavbarStyle } from '@/config/themes';
import { useNavbarData } from './navbarStyles/shared';
import { GamifiedNav } from './navbarStyles/gamifiedNav';
import { CleanNav } from './navbarStyles/cleanNav';
import { PremiumNav } from './navbarStyles/premiumNav';
import { FriendlyNav } from './navbarStyles/friendlyNav';

const NAV_VARIANTS = {
  gamified: GamifiedNav,
  clean: CleanNav,
  premium: PremiumNav,
  friendly: FriendlyNav,
} as const;

const Navbar: React.FC = () => {
  const style = useNavbarStyle();
  const data = useNavbarData();
  const Variant = NAV_VARIANTS[style];

  return <Variant data={data} />;
};

export { Navbar };
