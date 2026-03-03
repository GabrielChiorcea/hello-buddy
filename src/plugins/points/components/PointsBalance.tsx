/**
 * Casino/rewards style points balance card — used in Profile
 * Gold accents with shimmer and glow
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
      className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/50 via-orange-950/30 to-amber-950/50"
    >
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex items-center gap-4 p-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25 streak-glow">
          <Coins className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-amber-400/60 uppercase tracking-wider flex items-center gap-1.5">
            Puncte totale
            <Sparkles className="h-3 w-3 streak-sparkle" />
          </p>
          <p className="text-3xl font-black streak-shimmer streak-bonus-enter">
            {points ?? 0}
          </p>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
    </motion.div>
  );
}
