/**
 * Mini-card progres nivel (tiers) — inel XP și următorul nivel.
 * Feature flag: se afișează doar când plugin-ul "tiers" e activ și userul e autentificat.
 * Afișează multiplicator curent/următor, formula XP și exemplu (ex. 100 RON).
 */

import React from 'react';
import { useQuery } from '@apollo/client';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { getTierBadgeIcon } from '@/config/tierIcons';
import { GET_TIERS_ECONOMY_SETTINGS } from '@/graphql/queries';

/* ── Circular progress ring ── */
const XpRing: React.FC<{ percent: number; size?: number; stroke?: number }> = ({
  percent,
  size = 56,
  stroke = 4,
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

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

  // loyaltyTiers query eliminat - nextTier vine din user.nextTier (GraphQL resolver)

  const currentXp = user?.totalXp ?? 0;

  // Folosește doar user.nextTier din GraphQL (sursa de adevăr)
  const nextTier = user?.nextTier ?? null;
  const nextTierThreshold = nextTier?.xpThreshold;
  const xpToNextLevel = user?.xpToNextLevel ?? null;
  // Nivel maxim = nu există next tier (null), NU când xpToNextLevel === 0
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
  const multiplierPercentDelta = multiplier > 0 ? Math.round(((nextMultiplier - multiplier) / multiplier) * 100) : 0;

  const currentBenefit =
    user?.tier?.benefitDescription?.trim() ||
    (user?.tier ? `Puncte la livrare: x${multiplier.toFixed(1)} (multiplicator curent)` : 'Comandă pentru a câștiga XP');
  const nextBenefit =
    nextTier?.benefitDescription?.trim() ||
    (nextTier ? `Puncte x${nextMultiplier.toFixed(1)}` : null);

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

  const xpFormulaParts: string[] = [];
  if (xpPerOrder > 0) xpFormulaParts.push(`${xpPerOrder} XP per comandă`);
  if (xpPerRon > 0) xpFormulaParts.push(`1 XP la fiecare ${xpPerRon} RON`);
  const xpFormulaText = xpFormulaParts.length > 0 ? xpFormulaParts.join(' + ') : 'XP setat în Admin → Niveluri';

  return (
    <div className="w-full py-3 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl"
      >
        <div className={cn(
          'relative overflow-hidden rounded-2xl',
          'border border-border bg-card shadow-sm',
          'px-4 py-3',
        )}>
          <div className="relative flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <XpRing percent={progressPercent} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg leading-none">{currentBadgeIcon}</span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-foreground">{tierName}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Multiplicator puncte: x{multiplier.toFixed(1)}
                </span>
              </div>

              <div className="text-[11px] text-muted-foreground">
                {isMaxLevel ? (
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <Sparkles className="h-3 w-3" />
                    Nivel maxim atins!
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-foreground tabular-nums">{currentXp}</span>
                    <span className="text-muted-foreground/60"> / {nextTierThreshold} XP</span>
                    <span className="mx-1.5 text-border">·</span>
                    <span>
                      Încă <span className="font-semibold text-foreground">{xpToNextLevel}</span> XP
                    </span>
                  </>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {currentBenefit}
              </p>

              <p className="text-[10px] text-muted-foreground/90">
                Cum se calculează XP: {xpFormulaText}
              </p>

              <p className="text-[10px] text-muted-foreground/80">
                Exemplu comandă {exampleRon} RON: <span className="font-medium text-foreground">{exampleXp} XP</span>
                {examplePoints != null && (
                  <> · Puncte (cu multiplicatorul tău): <span className="font-medium text-foreground">{examplePoints}</span></>
                )}
              </p>
            </div>
          </div>

          {!isMaxLevel && nextTier && (
            <div className="relative mt-2 flex flex-wrap items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-[10px]">
              <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Următorul nivel:</span>
              <span className="font-semibold text-foreground">
                <span className="mr-0.5">{getTierBadgeIcon(nextTier.badgeIcon)}</span>
                {nextTier.name}
              </span>
              <span className="text-muted-foreground">
                — Puncte x{nextMultiplier.toFixed(1)}
                {multiplierPercentDelta !== 0 && (
                  <span className="text-primary"> (+{multiplierPercentDelta}%)</span>
                )}
              </span>
              {nextBenefit && (
                <>
                  <span className="text-border mx-0.5">·</span>
                  <span className="text-muted-foreground line-clamp-1">{nextBenefit}</span>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
