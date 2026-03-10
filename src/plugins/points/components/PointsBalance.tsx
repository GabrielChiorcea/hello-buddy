/**
 * Points Balance Card — style-aware
 * All styles use semantic design tokens.
 */

import { Coins, Sparkles, Star, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useComponentStyle } from '@/config/componentStyle';

interface PointsBalanceProps {
  points: number;
}

/** Gamified style — dark background, glow, shimmer */
function GamifiedBalance({ points }: PointsBalanceProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-reward/40 bg-reward-surface">
      <div className="absolute -top-16 -right-10 w-32 h-32 bg-reward/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-success/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex items-center gap-4 p-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-reward via-reward to-reward-accent flex items-center justify-center shadow-lg shadow-reward/40 streak-glow">
          <Coins className="h-6 w-6 text-reward-surface-foreground" />
        </div>
        <div>
          <p className="text-xs font-medium text-reward-light/80 uppercase tracking-wider flex items-center gap-1.5">
            Puncte totale <Sparkles className="h-3 w-3 streak-sparkle" />
          </p>
          <p className="text-3xl font-black text-reward streak-shimmer streak-bonus-enter">{points ?? 0}</p>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-reward/50 to-transparent" />
    </motion.div>
  );
}

/** Clean style — simple card */
function CleanBalance({ points }: PointsBalanceProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Coins className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Puncte totale</p>
        <p className="text-2xl font-bold text-foreground">{points ?? 0}</p>
      </div>
    </div>
  );
}

/** Premium style — elegant */
function PremiumBalance({ points }: PointsBalanceProps) {
  return (
    <div className="rounded-2xl bg-card border border-border/50 shadow-lg shadow-foreground/5 overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
      <div className="p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-b from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center">
          <Star className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest">Puncte disponibile</p>
          <p className="text-2xl font-semibold text-foreground tracking-tight">{points ?? 0}</p>
        </div>
      </div>
    </div>
  );
}

/** Friendly style — warm and approachable */
function FriendlyBalance({ points }: PointsBalanceProps) {
  return (
    <div className="rounded-2xl bg-accent/30 border-2 border-accent p-4 flex items-center gap-4 shadow-md">
      <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
        <Heart className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">⭐ Punctele tale</p>
        <p className="text-2xl font-bold text-foreground">{points ?? 0}</p>
      </div>
    </div>
  );
}

export function PointsBalance({ points }: PointsBalanceProps) {
  const style = useComponentStyle();
  switch (style) {
    case 'clean': return <CleanBalance points={points} />;
    case 'premium': return <PremiumBalance points={points} />;
    case 'friendly': return <FriendlyBalance points={points} />;
    default: return <GamifiedBalance points={points} />;
  }
}
