/**
 * Footer — Dispatcher care alege varianta vizuală
 */

import React from 'react';
import { useFooterStyle } from '@/config/themes';
import { createStyleVariants, StyleVariantSuspense } from '@/lib/styleVariants';
import { useFooterData } from './footerStyles/shared';
import type { FooterDisplayData } from './footerStyles/shared';

const FOOTER_VARIANTS = createStyleVariants<{ data: FooterDisplayData }>({
  gamified: () => import('./footerStyles/gamifiedFooter').then((m) => ({ default: m.GamifiedFooter })),
  clean: () => import('./footerStyles/cleanFooter').then((m) => ({ default: m.CleanFooter })),
  premium: () => import('./footerStyles/premiumFooter').then((m) => ({ default: m.PremiumFooter })),
  friendly: () => import('./footerStyles/friendlyFooter').then((m) => ({ default: m.FriendlyFooter })),
});

const Footer: React.FC = () => {
  const style = useFooterStyle();
  const data = useFooterData();
  const Variant = FOOTER_VARIANTS[style];

  return (
    <StyleVariantSuspense>
      <Variant data={data} />
    </StyleVariantSuspense>
  );
};

export { Footer };
