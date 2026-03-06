/**
 * Slim, elegant tier progress bar — always visible when authenticated + tiers enabled.
 * Minimal footprint: single-line with XP progress, collapsible details on hover/tap.
 */

import React from 'react';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { cn } from '@/lib/utils';

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

  return (
    <div className="w-full bg-card/80 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-3 text-xs">
          {/* Badge + Tier name */}
          <span className="flex items-center gap-1.5 font-semibold text-foreground/80 shrink-0">
            {badgeIcon && <span className="text-sm">{badgeIcon}</span>}
            {tierName}
          </span>

          {/* Multiplier chip */}
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            x{multiplier.toFixed(1)}
          </span>

          {/* Progress bar */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out',
                  isMaxLevel
                    ? 'bg-primary'
                    : 'bg-gradient-to-r from-primary/80 to-primary'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* XP label */}
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {isMaxLevel ? (
              <span className="text-primary/80 font-medium">MAX</span>
            ) : (
              <>
                {currentXp}
                <span className="text-muted-foreground/60"> / {nextTierThreshold} XP</span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
