/**
 * Footer — Dispatcher care alege varianta vizuală
 */

import React from 'react';
import { useFooterStyle } from '@/config/themes';
import { useFooterData } from './footerStyles/shared';
import { GamifiedFooter } from './footerStyles/gamifiedFooter';
import { CleanFooter } from './footerStyles/cleanFooter';
import { PremiumFooter } from './footerStyles/premiumFooter';
import { FriendlyFooter } from './footerStyles/friendlyFooter';

const FOOTER_VARIANTS = {
  gamified: GamifiedFooter,
  clean: CleanFooter,
  premium: PremiumFooter,
  friendly: FriendlyFooter,
} as const;

const Footer: React.FC = () => {
  const style = useFooterStyle();
  const data = useFooterData();
  const Variant = FOOTER_VARIANTS[style];

  return <Variant data={data} />;
};

export { Footer };
