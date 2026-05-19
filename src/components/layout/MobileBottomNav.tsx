/**
 * MobileBottomNav — Dispatcher care alege varianta vizuală
 * în funcție de stilul configurat la build-time în src/config/themes/index.ts
 */

import React from 'react';
import { useVisualViewportInsets } from '@/hooks/useVisualViewportInsets';
import { useNavbarStyle } from '@/config/themes';
import { createStyleVariants, StyleVariantSuspense } from '@/lib/styleVariants';
import { useMobileNavData } from './mobileNavStyles/shared';
import type { MobileNavDisplayData } from './mobileNavStyles/shared';

const MOBILE_NAV_VARIANTS = createStyleVariants<{ data: MobileNavDisplayData }>({
  gamified: () => import('./mobileNavStyles/gamifiedMobileNav').then((m) => ({ default: m.GamifiedMobileNav })),
  clean: () => import('./mobileNavStyles/cleanMobileNav').then((m) => ({ default: m.CleanMobileNav })),
  premium: () => import('./mobileNavStyles/premiumMobileNav').then((m) => ({ default: m.PremiumMobileNav })),
  friendly: () => import('./mobileNavStyles/friendlyMobileNav').then((m) => ({ default: m.FriendlyMobileNav })),
});

const MobileBottomNav: React.FC = () => {
  useVisualViewportInsets();
  const style = useNavbarStyle();
  const data = useMobileNavData();
  const Variant = MOBILE_NAV_VARIANTS[style];

  return (
    <StyleVariantSuspense>
      <Variant data={data} />
    </StyleVariantSuspense>
  );
};

export { MobileBottomNav };
