/**
 * Gamified Tier Progress Card — visual, compact, mobile-first.
 * Shows current tier badge, XP progress bar with gradient, next tier preview.
 */

import React from 'react';
import { useQuery } from '@apollo/client';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Zap } from 'lucide-react';
import { getTierBadgeIcon } from '@/config/tierIcons';
import { GET_TIERS_ECONOMY_SETTINGS } from '@/graphql/queries';

/* ── Gradient Progress Bar ── */
const GradientProgressBar: React.FC<{ percent: number }> = ({ percent }) => (
  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${percent}%` }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-y-0 left-0 rounded-full"
      style={{
        background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(16 90% 60%), hsl(36 100% 55%))',
      }}
    />
    {/* Shimmer overlay */}
    <div
      className="absolute inset-y-0 w-1/3 rounded-full opacity-30"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
        animation: 'shimmer-sweep 2.5s ease-in-out infinite',
      }}
    />
  </div>
);

interface EconomySettings {
  tiers_xp_per_ron: string | null;
  tiers_xp_per_order: string | null;
  points_per_order: string | null;
  points_per_ron: string | null;
}

export const TierProgressBar: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.user);
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');
  const { enabled: pointsEnabled } = usePluginEnabled('points');

  const { data: economyData } = useQuery<{
    tiers_xp_per_ron: string | null;
    tiers_xp_per_order: string | null;
    points_per_order: string | null;
    points_per_ron: string | null;
  }>(GET_TIERS_ECONOMY_SETTINGS, {
    skip: !tiersEnabled,
    fetchPolicy: 'cache-first',
  });

  const currentXp = user?.totalXp ?? 0;
  const nextTier = user?.nextTier ?? null;
  const nextTierThreshold = nextTier?.xpThreshold;
  const xpToNextLevel = user?.xpToNextLevel ?? null;
  const isMaxLevel = xpToNextLevel === null || xpToNextLevel === undefined;

  const hasTier = Boolean(user?.tier);
  const hasNextTier = nextTier != null;
  const canShowBar = tiersEnabled && isAuthenticated && (hasTier || hasNextTier);

  if (!canShowBar) return null;

  const currentTierThreshold = user?.tier?.xpThreshold ?? 0;

  let progressPercent = 100;
  if (!isMaxLevel && nextTierThreshold !== undefined && nextTierThreshold > currentTierThreshold) {
    const range = nextTierThreshold - currentTierThreshold;
    const gained = currentXp - currentTierThreshold;
    if (range > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round((gained / range) * 100)));
    }
  }

  const tierName = user?.tier?.name ?? 'Începător';
  const currentBadgeIcon = getTierBadgeIcon(user?.tier?.badgeIcon);
  const multiplier = user?.tier?.pointsMultiplier ?? 1;
  const nextMultiplier = nextTier?.pointsMultiplier ?? 1;

  const settings: EconomySettings = {
    tiers_xp_per_ron: economyData?.tiers_xp_per_ron ?? null,
    tiers_xp_per_order: economyData?.tiers_xp_per_order ?? null,
    points_per_order: economyData?.points_per_order ?? null,
    points_per_ron: economyData?.points_per_ron ?? null,
  };

  const xpPerOrder = Math.max(0, parseInt(settings.tiers_xp_per_order ?? '0', 10) || 0);
  const xpPerRon = Math.max(0, parseInt(settings.tiers_xp_per_ron ?? '0', 10) || 0);
  const pointsPerOrder = Math.max(0, parseInt(settings.points_per_order ?? '5', 10) || 5);
  const pointsPerRon = Math.max(0, parseInt(settings.points_per_ron ?? '0', 10) || 0);

  const exampleRon = 100;
  const exampleXp = xpPerOrder + (xpPerRon > 0 ? Math.floor(exampleRon / xpPerRon) : 0);
  const basePoints = pointsPerOrder + (pointsPerRon > 0 ? Math.floor(exampleRon / pointsPerRon) : 0);
  const examplePoints = pointsEnabled ? Math.round(basePoints * multiplier) : null;

  return (
    <div className="w-full py-2 px-3 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl"
      >
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border border-border shadow-sm',
            'bg-gradient-to-br from-card via-card to-accent/30',
          )}
        >
          {/* ── Top section: Badge + Info ── */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            {/* Large badge with glow */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                'bg-gradient-to-br from-primary/20 to-accent/40',
                'ring-2 ring-primary/20',
              )}>
                <span className="text-2xl leading-none">{currentBadgeIcon}</span>
              </div>
              {/* Multiplier pill overlapping badge */}
              <div className="absolute -bottom-1 -right-1 flex h-5 items-center rounded-full bg-primary px-1.5 shadow-sm">
                <Zap className="h-2.5 w-2.5 text-primary-foreground" />
                <span className="text-[9px] font-bold text-primary-foreground">x{multiplier.toFixed(1)}</span>
              </div>
            </div>

            {/* Tier name + XP count */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground truncate">{tierName}</span>
                {isMaxLevel && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                    <Sparkles className="h-2.5 w-2.5" /> MAX
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isMaxLevel ? (
                  <span className="text-primary font-medium">Nivel maxim atins!</span>
                ) : (
                  <>
                    <span className="font-semibold text-foreground tabular-nums">{currentXp}</span>
                    <span className="text-muted-foreground/60"> / {nextTierThreshold} XP</span>
                  </>
                )}
              </p>
            </div>

            {/* Example reward — desktop only */}
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[10px] text-muted-foreground">Exemplu {exampleRon} RON:</span>
              <span className="text-xs font-semibold text-foreground">+{exampleXp} XP</span>
              {examplePoints != null && (
                <span className="text-[10px] text-muted-foreground">+{examplePoints} pct</span>
              )}
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div className="px-4 pb-2">
            <GradientProgressBar percent={progressPercent} />
            {!isMaxLevel && xpToNextLevel != null && (
              <p className="mt-1 text-[10px] text-muted-foreground text-right tabular-nums">
                Încă <span className="font-semibold text-foreground">{xpToNextLevel}</span> XP
              </p>
            )}
          </div>

          {/* ── Next tier banner ── */}
          {!isMaxLevel && nextTier && (
            <div className={cn(
              'flex items-center gap-2 px-4 py-2',
              'bg-secondary/60 border-t border-border/50',
            )}>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground">Următorul:</span>
              <span className="text-[11px] font-semibold text-foreground">
                {getTierBadgeIcon(nextTier.badgeIcon)} {nextTier.name}
              </span>
              <span className="ml-auto text-[10px] font-medium text-primary">
                x{nextMultiplier.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
