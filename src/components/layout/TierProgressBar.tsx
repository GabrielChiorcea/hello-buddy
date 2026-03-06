/**
 * Floating mini-card — tier progress with circular XP ring.
 * Uses design system tokens to match the app's clean Glovo/Bolt aesthetic.
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
          'relative overflow-hidden rounded-2xl',
          'border border-border bg-card shadow-sm',
          'px-4 py-3',
        )}>
          <div className="relative flex items-center gap-3">
            {/* Circular XP ring with badge inside */}
            <div className="relative flex-shrink-0">
              <XpRing percent={progressPercent} />
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
                <span className="text-sm font-bold text-foreground">
                  {tierName}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  x{multiplier.toFixed(1)}
                </span>
              </div>

              {/* XP progress text */}
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

              {/* Current benefit */}
              <p className="text-[10px] text-muted-foreground truncate">
                {currentBenefit}
              </p>
            </div>
          </div>

          {/* Next level preview */}
          {!isMaxLevel && user?.nextTier && (
            <div className="relative mt-2 flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-[10px]">
              <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Următorul nivel:</span>
              <span className="font-semibold text-foreground">
                {user.nextTier.badgeIcon && <span className="mr-0.5">{user.nextTier.badgeIcon}</span>}
                {user.nextTier.name}
              </span>
              {nextBenefit && (
                <>
                  <span className="text-border mx-0.5">—</span>
                  <span className="text-muted-foreground truncate">{nextBenefit}</span>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
