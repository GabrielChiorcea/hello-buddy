/**
 * Home — Dispatcher care alege varianta vizuală
 */

import React from 'react';
import { useHomeStyle } from '@/config/themes';
import { useHomeData } from './homeStyles/shared';
import { GamifiedHome } from './homeStyles/gamifiedHome';
import { CleanHome } from './homeStyles/cleanHome';
import { PremiumHome } from './homeStyles/premiumHome';
import { FriendlyHome } from './homeStyles/friendlyHome';

const HOME_VARIANTS = {
  gamified: GamifiedHome,
  clean: CleanHome,
  premium: PremiumHome,
  friendly: FriendlyHome,
} as const;

const Home: React.FC = () => {
  const style = useHomeStyle();
  const data = useHomeData();
  const Variant = HOME_VARIANTS[style];

  return <Variant data={data} />;
};

export default Home;
