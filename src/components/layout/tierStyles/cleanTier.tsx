/**
 * Clean / Minimal Tier — simplu, discret, fără animații agresive (healthy, salad bars)
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { texts } from '@/config/texts';
import type { TierDisplayData } from './shared';

export const CleanTier: React.FC<{ data: TierDisplayData }> = ({ data }) => {
  const { tierName, currentBadgeIcon, multiplier, currentXp, progressPercent, isMaxLevel, xpToNextLevel, nextTierThreshold, currentBenefit, nextTier, nextBenefitText, nextMultiplier, hasFreeProductBenefits, freeProductCampaignsSummary } = data;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{currentBadgeIcon}</span>
          <div>
            <span className="text-sm font-semibold text-foreground">{tierName}</span>
            {isMaxLevel && (
              <span className="ml-2 text-[10px] text-primary font-medium">Nivel maxim</span>
            )}
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-secondary rounded-md px-2 py-1">
          x{multiplier.toFixed(1)} puncte
        </span>
      </div>

      {/* Progress */}
      {!isMaxLevel && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{currentXp} XP</span>
            <span>{nextTierThreshold} XP</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {xpToNextLevel != null && (
            <p className="text-[10px] text-muted-foreground">
              Încă {xpToNextLevel} XP
            </p>
          )}
        </div>
      )}

      {/* Current benefit */}
      <p className="text-xs text-muted-foreground">{currentBenefit}</p>
      {hasFreeProductBenefits ? (
        <p className="text-[10px] text-success mt-1">
          {texts.freeProducts.rankInfoActivePrefix}{' '}
          {freeProductCampaignsSummary.length > 0 ? freeProductCampaignsSummary.map((c) => c.name).join(', ') : ''}
        </p>
      ) : (
        <p className="text-[10px] text-muted-foreground mt-1">{texts.freeProducts.rankInfoNone}</p>
      )}

      {/* Next tier */}
      {!isMaxLevel && nextTier && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border">
          <ArrowRight className="h-3 w-3 text-primary" />
          <span>Următor: <span className="font-medium text-foreground">{nextTier.name}</span></span>
          <span className="ml-auto text-primary font-medium">x{nextMultiplier.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
};
