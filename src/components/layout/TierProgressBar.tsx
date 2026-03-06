/**
 * Bara de progres nivel (tiers) – afișată pe toate paginile când utilizatorul e autentificat și plugin-ul tiers e activ.
 * Arată: XP curent, XP până la nivelul următor, beneficii actuale și beneficii la următorul nivel.
 */

import React from 'react';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';

export const TierProgressBar: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.user);
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');

  const hasTier = Boolean(user?.tier);
  const hasNextTier = user?.nextTier != null;
  const canShowBar = tiersEnabled && isAuthenticated && (hasTier || hasNextTier);

  if (!canShowBar) {
    return null;
  }

  const currentXp = user?.totalXp ?? 0;
  const currentTierThreshold = user?.tier?.xpThreshold ?? 0;
  const nextTierThreshold = user?.nextTier?.xpThreshold;
  const xpToNextLevel = user?.xpToNextLevel ?? null;

  let progressPercent = 100;
  if (xpToNextLevel != null && nextTierThreshold !== undefined && nextTierThreshold > currentTierThreshold) {
    const range = nextTierThreshold - currentTierThreshold;
    const gainedInRange = currentXp - currentTierThreshold;
    if (range > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round((gainedInRange / range) * 100)));
    }
  }

  const currentBenefit =
    user?.tier?.benefitDescription?.trim() ||
    (user?.tier
      ? `Puncte x${(user.tier.pointsMultiplier ?? 1).toFixed(2)}`
      : 'Câștigă XP la comenzi pentru a urca în nivel');
  const nextBenefit =
    user?.nextTier?.benefitDescription?.trim() ||
    (user?.nextTier
      ? `Puncte x${(user.nextTier.pointsMultiplier ?? 1).toFixed(2)}`
      : null);

  return (
    <div className="w-full border-t border-amber-900/40 bg-gradient-to-r from-amber-950/60 via-background to-amber-950/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Nivel curent + badge (sau "Începător" dacă nu are încă tier) */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="font-semibold text-amber-200">
              {user?.tier?.badgeIcon && (
                <span className="mr-1">{user.tier.badgeIcon}</span>
              )}
              Nivel {user?.tier?.name ?? 'Începător'}
            </span>
            <span className="rounded-full bg-amber-900/70 px-2 py-0.5 text-[11px] text-amber-100">
              x{(user?.tier?.pointsMultiplier ?? 1).toFixed(2)} puncte
            </span>
          </div>

          {/* Bară progres + XP */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
              <span>{currentXp} XP</span>
              {xpToNextLevel != null && nextTierThreshold !== undefined && xpToNextLevel > 0 ? (
                <span>
                  Mai ai <strong className="text-foreground">{xpToNextLevel} XP</strong> până la {user?.nextTier?.name}
                </span>
              ) : (
                <span className="text-amber-200/90">Ai atins nivelul maxim</span>
              )}
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-amber-950/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Beneficii actuale și la următorul nivel */}
        <div className="mt-3 flex flex-col gap-1.5 border-t border-amber-900/30 pt-3 text-xs md:flex-row md:gap-6">
          <div className="flex flex-shrink-0 gap-2">
            <span className="font-medium text-muted-foreground">Beneficii actuale:</span>
            <span className="text-amber-100">{currentBenefit}</span>
          </div>
          {nextBenefit && xpToNextLevel != null && xpToNextLevel > 0 ? (
            <div className="flex flex-shrink-0 gap-2">
              <span className="font-medium text-muted-foreground">La următorul nivel:</span>
              <span className="text-amber-200/90">{nextBenefit}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
