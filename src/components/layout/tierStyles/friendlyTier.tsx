/**
 * Friendly / Casual Tier — cald, accesibil, rotunjit (bistro, italian, casual dining)
 */
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Heart, Sparkles, ArrowUp } from 'lucide-react';
import { texts } from '@/config/texts';
import type { TierDisplayData } from './shared';

export const FriendlyTier: React.FC<{ data: TierDisplayData }> = ({ data }) => {
  const { tierName, currentBadgeIcon, multiplier, currentXp, progressPercent, isMaxLevel, xpToNextLevel, nextTierThreshold, currentBenefit, xpFormulaText, nextTier, nextBenefitText, nextMultiplier, hasFreeProductBenefits, freeProductCampaignsSummary } = data;

  return (
    <div className={cn(
      'rounded-2xl border border-border bg-card overflow-hidden',
      'shadow-sm',
    )}>
      {/* Warm header with accent background */}
      <div className="bg-primary/5 px-4 pt-4 pb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
          <span className="text-xl">{currentBadgeIcon}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-foreground">{tierName}</span>
            {isMaxLevel && <Sparkles className="h-3 w-3 text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {isMaxLevel ? 'Ai atins nivelul maxim! 🎉' : `${currentXp} / ${nextTierThreshold} XP`}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1">
          <Heart className="h-3 w-3" />
          <span className="text-[11px] font-bold">x{multiplier.toFixed(1)}</span>
        </div>
      </div>

      {/* Progress */}
      {!isMaxLevel && (
        <div className="px-4 pt-3 pb-2">
          <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full bg-primary"
            />
          </div>
          {xpToNextLevel != null && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Mai ai nevoie de <span className="font-semibold text-foreground">{xpToNextLevel} XP</span> 💪
            </p>
          )}
        </div>
      )}

      {/* Benefit */}
      <div className="px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          ✨ {currentBenefit}
        </p>
        {hasFreeProductBenefits ? (
          <p className="text-[10px] text-success mt-1">
            {texts.freeProducts.rankInfoActivePrefix}{' '}
            {freeProductCampaignsSummary.length > 0 ? freeProductCampaignsSummary.map((c) => c.name).join(', ') : ''}
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground mt-1">{texts.freeProducts.rankInfoNone}</p>
        )}
      </div>

      {/* Next tier */}
      {!isMaxLevel && nextTier && (
        <div className="px-4 py-2.5 bg-accent/30 border-t border-border/40 flex items-center gap-2">
          <ArrowUp className="h-3 w-3 text-primary" />
          <span className="text-[11px] text-muted-foreground">
            Următorul nivel: <span className="font-semibold text-foreground">{nextTier.name}</span>
          </span>
          <span className="ml-auto text-[10px] font-bold text-primary">x{nextMultiplier.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
};
