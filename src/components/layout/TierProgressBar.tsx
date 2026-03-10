/**
 * TierProgressBar — delegates rendering to the active component style variant.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { useTierStyle } from '@/config/componentStyle';
import { useTierDisplayData } from './tierStyles/shared';
import { GamifiedTier } from './tierStyles/gamifiedTier';
import { CleanTier } from './tierStyles/cleanTier';
import { PremiumTier } from './tierStyles/premiumTier';
import { FriendlyTier } from './tierStyles/friendlyTier';

const TIER_VARIANTS = {
  gamified: GamifiedTier,
  clean: CleanTier,
  premium: PremiumTier,
  friendly: FriendlyTier,
} as const;

export const TierProgressBar: React.FC = () => {
  const style = useComponentStyle();
  const data = useTierDisplayData();

  if (!data) return null;

  const Variant = TIER_VARIANTS[style];

  return (
    <div className="w-full py-2 px-3 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl"
      >
        <Variant data={data} />
      </motion.div>
    </div>
  );
};
