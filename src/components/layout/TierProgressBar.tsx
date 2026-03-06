/**
 * Casino-style floating mini-card — tier progress with circular XP ring.
 * Shown on all pages when user is authenticated and tiers plugin is active.
 */

import React from 'react';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';

/* ── Circular progress ring ── */
const XpRing: React.FC<{ percent: number; size?: number; stroke?: number }> = ({
  percent,
  size = 64,
  stroke = 5,
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsla(43, 50%, 50%, 0.15)"
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#xp-ring-gradient)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id="xp-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(43, 96%, 56%)" />
          <stop offset="100%" stopColor="hsl(36, 100%, 50%)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const TierProgressBar: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.user);
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');

  const hasTier = Boolean(user?.tier);
  const hasNextTier = user?.nextTier != null;
  const canShowBar = tiersEnabled && isAuthenticated && (hasTier || hasNextTier);

  if (!canShowBar) return null;

  const currentXp = user?.totalXp ?? 0;
  const currentTierThreshold = user?.tier?.xpThreshold ?? 0;
  const nextTierThreshold = user?.nextTier?.xpThreshold;
  const xpToNextLevel = user?.xpToNextLevel ?? null;
  const isMaxLevel = xpToNextLevel == null || xpToNextLevel <= 0;

  let progressPercent = 100;
  if (!isMaxLevel && nextTierThreshold !== undefined && nextTierThreshold > currentTierThreshold) {
    const range = nextTierThreshold - currentTierThreshold;
    const gained = currentXp - currentTierThreshold;
    if (range > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round((gained / range) * 100)));
    }
  }

  const tierName = user?.tier?.name ?? 'Începător';
  const badgeIcon = user?.tier?.badgeIcon;
  const multiplier = user?.tier?.pointsMultiplier ?? 1;
  const currentBenefit =
    user?.tier?.benefitDescription?.trim() ||
    (user?.tier ? `Câștigi x${multiplier.toFixed(1)} puncte` : 'Comandă pentru a câștiga XP');
  const nextBenefit =
    user?.nextTier?.benefitDescription?.trim() ||
    (user?.nextTier ? `x${(user.nextTier.pointsMultiplier ?? 1).toFixed(1)} puncte` : null);

  return (
    <div className="w-full py-3 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-lg"
      >
        <div className={cn(
          'relative overflow-hidden rounded-2xl border border-amber-500/20',
          'bg-gradient-to-br from-amber-950/80 via-amber-950/60 to-amber-900/40',
          'backdrop-blur-sm shadow-lg shadow-amber-900/10',
          'px-4 py-3',
        )}>
          {/* Subtle shimmer overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent" />

          <div className="relative flex items-center gap-3">
            {/* Circular XP ring with badge inside */}
            <div className="relative flex-shrink-0">
              <XpRing percent={progressPercent} size={56} stroke={4} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg leading-none">
                  {badgeIcon || '⭐'}
                </span>
              </div>
            </div>

            {/* Info section */}
            <div className="min-w-0 flex-1 space-y-1">
              {/* Tier name + multiplier */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold streak-shimmer">
                  {tierName}
                </span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  x{multiplier.toFixed(1)}
                </span>
              </div>

              {/* XP progress text */}
              <div className="text-[11px] text-amber-100/70">
                {isMaxLevel ? (
                  <span className="flex items-center gap-1 text-amber-300 font-medium">
                    <Sparkles className="h-3 w-3" />
                    Nivel maxim atins!
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-amber-200 tabular-nums">{currentXp}</span>
                    <span className="text-amber-100/40"> / {nextTierThreshold} XP</span>
                    <span className="mx-1.5 text-amber-100/20">·</span>
                    <span>
                      Încă <span className="font-semibold text-amber-200">{xpToNextLevel}</span> XP
                    </span>
                  </>
                )}
              </div>

              {/* Current benefit */}
              <p className="text-[10px] text-amber-100/50 truncate">
                {currentBenefit}
              </p>
            </div>
          </div>

          {/* Next level preview */}
          {!isMaxLevel && user?.nextTier && (
            <div className="relative mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[10px]">
              <ChevronRight className="h-3 w-3 text-amber-400/60 flex-shrink-0" />
              <span className="text-amber-100/50">Următorul nivel:</span>
              <span className="font-semibold text-amber-300">
                {user.nextTier.badgeIcon && <span className="mr-0.5">{user.nextTier.badgeIcon}</span>}
                {user.nextTier.name}
              </span>
              {nextBenefit && (
                <>
                  <span className="text-amber-100/20 mx-0.5">—</span>
                  <span className="text-amber-200/70 truncate">{nextBenefit}</span>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
