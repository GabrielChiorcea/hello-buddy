/**
 * Premium Tier — elegant, sobru, refined (restaurante upscale)
 */
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Crown, ChevronRight } from 'lucide-react';
import { texts } from '@/config/texts';
import type { TierDisplayData } from './shared';

export const PremiumTier: React.FC<{ data: TierDisplayData }> = ({ data }) => {
  const { tierName, currentBadgeIcon, multiplier, currentXp, progressPercent, isMaxLevel, xpToNextLevel, nextTierThreshold, currentBenefit, nextTier, nextBenefitText, nextMultiplier, hasFreeProductBenefits, freeProductCampaignsSummary } = data;

  return (
    <div className={cn(
      'rounded-2xl border border-border/60 overflow-hidden',
      'bg-gradient-to-b from-card to-secondary/30',
      'shadow-[0_2px_20px_-4px_hsl(var(--primary)/0.08)]',
    )}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-4">
        <div className={cn(
          'flex h-14 w-14 items-center justify-center rounded-2xl',
          'bg-gradient-to-br from-secondary to-muted',
          'border border-border/40',
        )}>
          <span className="text-2xl">{currentBadgeIcon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground tracking-tight">{tierName}</h3>
            {isMaxLevel && (
              <Crown className="h-3.5 w-3.5 text-primary" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 tracking-wide uppercase">
            Multiplicator x{multiplier.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Elegant progress */}
      {!isMaxLevel && (
        <div className="px-5 pb-3">
          <div className="h-1 w-full rounded-full bg-border/40 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-primary/80"
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground tracking-wide">
            <span>{currentXp} XP</span>
            {xpToNextLevel != null && (
              <span>Încă {xpToNextLevel} XP</span>
            )}
          </div>
        </div>
      )}

      {/* Benefit */}
      <div className="px-5 pb-3">
        <p className="text-xs text-muted-foreground leading-relaxed italic">
          „{currentBenefit}"
        </p>
      </div>

      {/* Next tier */}
      {!isMaxLevel && nextTier && (
        <div className="px-5 py-3 bg-secondary/40 border-t border-border/30 flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-[11px] text-muted-foreground">
            Nivelul următor: <span className="font-medium text-foreground">{nextTier.name}</span>
          </span>
          {nextBenefitText && (
            <span className="ml-auto text-[10px] text-primary/80 font-medium">
              x{nextMultiplier.toFixed(1)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
