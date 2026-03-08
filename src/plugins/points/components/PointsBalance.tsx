/**
 * Casino/rewards style points balance card — used in Profile
 * All colors use semantic reward-* tokens.
 */

import { Coins, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface PointsBalanceProps {
  points: number;
}

export function PointsBalance({ points }: PointsBalanceProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-reward/40 bg-reward-surface"
    >
      {/* Ambient glow */}
      <div className="absolute -top-16 -right-10 w-32 h-32 bg-reward/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-success/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex items-center gap-4 p-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-reward via-reward to-reward-accent flex items-center justify-center shadow-lg shadow-reward/40 streak-glow">
          <Coins className="h-6 w-6 text-reward-surface-foreground" />
        </div>
        <div>
          <p className="text-xs font-medium text-reward-light/80 uppercase tracking-wider flex items-center gap-1.5">
            Puncte totale
            <Sparkles className="h-3 w-3 streak-sparkle" />
          </p>
          <p className="text-3xl font-black text-reward streak-shimmer streak-bonus-enter">
            {points ?? 0}
          </p>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-reward/50 to-transparent" />
    </motion.div>
  );
}
