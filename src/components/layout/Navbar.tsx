/**
 * Navbar — Dispatcher care alege varianta vizuală
 * în funcție de stilul configurat la build-time în src/config/themes/index.ts
 */

import React from 'react';
import { useNavbarStyle } from '@/config/themes';
import { createStyleVariants, StyleVariantSuspense } from '@/lib/styleVariants';
import { useNavbarData } from './navbarStyles/shared';
import type { NavbarDisplayData } from './navbarStyles/shared';

const NAV_VARIANTS = createStyleVariants<{ data: NavbarDisplayData }>({
  gamified: () => import('./navbarStyles/gamifiedNav').then((m) => ({ default: m.GamifiedNav })),
  clean: () => import('./navbarStyles/cleanNav').then((m) => ({ default: m.CleanNav })),
  premium: () => import('./navbarStyles/premiumNav').then((m) => ({ default: m.PremiumNav })),
  friendly: () => import('./navbarStyles/friendlyNav').then((m) => ({ default: m.FriendlyNav })),
});

const Navbar: React.FC = () => {
  const style = useNavbarStyle();
  const data = useNavbarData();
  const Variant = NAV_VARIANTS[style];

  return (
    <StyleVariantSuspense>
      <Variant data={data} />
    </StyleVariantSuspense>
  );
};

export { Navbar };
