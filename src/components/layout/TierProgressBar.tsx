/**
 * Gamified Tier Progress Card — visual, compact, mobile-first.
 * Shows current tier badge, XP progress, benefits, next tier unlock, XP formula.
 */

import React from 'react';
import { useQuery } from '@apollo/client';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Zap, Gift, Star, TrendingUp } from 'lucide-react';
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
    <div
      className="absolute inset-y-0 w-1/3 rounded-full opacity-30"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
        animation: 'shimmer-sweep 2.5s ease-in-out infinite',
      }}
    />
  </div>
);

/* ── Info pill ── */
const InfoPill: React.FC<{ icon: React.ReactNode; children: React.ReactNode; variant?: 'default' | 'highlight' }> = ({
  icon, children, variant = 'default',
}) => (
  <div className={cn(
    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px]',
    variant === 'highlight'
      ? 'bg-primary/10 text-primary'
      : 'bg-secondary/80 text-muted-foreground',
  )}>
    <span className="flex-shrink-0">{icon}</span>
    <span className="leading-tight">{children}</span>
  </div>
);

export const TierProgressBar: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.user);
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');
  const { enabled: pointsEnabled } = usePluginEnabled('points');

  const { data: economyData } = useQuery<{
    tiers_xp_per_ron: string | null;
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

  // Current benefit text
  const currentBenefit =
    user?.tier?.benefitDescription?.trim() ||
    (pointsEnabled
      ? `Primești x${multiplier.toFixed(1)} puncte la fiecare comandă livrată`
      : 'Comandă pentru a câștiga XP și a avansa');

  // Next tier benefit text
  const nextBenefitText =
    nextTier?.benefitDescription?.trim() ||
    (nextTier && pointsEnabled
      ? `Puncte x${nextMultiplier.toFixed(1)} la fiecare comandă`
      : null);

  // XP formula (doar pe baza RON cheltuiți)
  const xpPerRon = Math.max(0, parseInt(economyData?.tiers_xp_per_ron ?? '0', 10) || 0);
  const xpFormulaText = xpPerRon > 0
    ? `+1 XP la fiecare ${xpPerRon} RON cheltuiți`
    : 'XP se acumulează la fiecare comandă';

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
          {/* ── Top: Badge + Info ── */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <div className="relative flex-shrink-0">
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                'bg-gradient-to-br from-primary/20 to-accent/40',
                'ring-2 ring-primary/20',
              )}>
                <span className="text-2xl leading-none">{currentBadgeIcon}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 items-center rounded-full bg-primary px-1.5 shadow-sm">
                <Zap className="h-2.5 w-2.5 text-primary-foreground" />
                <span className="text-[9px] font-bold text-primary-foreground">x{multiplier.toFixed(1)}</span>
              </div>
            </div>

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
                  <span className="text-primary font-medium">Nivel maxim atins! 🎉</span>
                ) : (
                  <>
                    <span className="font-semibold text-foreground tabular-nums">{currentXp}</span>
                    <span className="text-muted-foreground/60"> / {nextTierThreshold} XP</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div className="px-4 pb-2">
            <GradientProgressBar percent={progressPercent} />
            {!isMaxLevel && xpToNextLevel != null && (
              <p className="mt-1 text-[10px] text-muted-foreground text-right tabular-nums">
                Încă <span className="font-semibold text-foreground">{xpToNextLevel}</span> XP până la nivelul următor
              </p>
            )}
          </div>

          {/* ── Benefits & Info pills ── */}
          <div className="px-4 pb-3 space-y-1.5">
            {/* Current benefit */}
            <InfoPill icon={<Gift className="h-3 w-3" />} variant="highlight">
              <span className="font-medium">Acum:</span> {currentBenefit}
            </InfoPill>

            {/* How XP is earned */}
            <InfoPill icon={<TrendingUp className="h-3 w-3" />}>
              <span className="font-medium">Cum câștigi XP:</span> {xpFormulaText}
            </InfoPill>
          </div>

          {/* ── Next tier unlock banner ── */}
          {!isMaxLevel && nextTier && (
            <div className={cn(
              'flex flex-col gap-1 px-4 py-2.5',
              'bg-secondary/60 border-t border-border/50',
            )}>
              <div className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-[11px] text-muted-foreground">La nivelul următor:</span>
                <span className="text-[11px] font-semibold text-foreground">
                  {getTierBadgeIcon(nextTier.badgeIcon)} {nextTier.name}
                </span>
                <span className="ml-auto text-[10px] font-bold text-primary">
                  x{nextMultiplier.toFixed(1)}
                </span>
              </div>
              {nextBenefitText && (
                <div className="flex items-center gap-2 pl-5">
                  <Star className="h-3 w-3 text-primary/60 flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground line-clamp-1">
                    Deblochezi: <span className="font-medium text-foreground">{nextBenefitText}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
