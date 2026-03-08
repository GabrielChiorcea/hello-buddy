/**
 * Casino/rewards style points checkout selector
 * All colors use semantic reward-* tokens.
 */

import { Gift, Sparkles, Coins, Check } from 'lucide-react';
import type { PointsReward } from '../types';
import type { CheckoutData } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PointsCheckoutSelectorProps {
  userPoints: number;
  rewards: PointsReward[];
  formData: CheckoutData;
  onPointsChange: (pointsToUse: number | undefined) => void;
  currency?: string;
}

export function PointsCheckoutSelector({
  userPoints,
  rewards,
  formData,
  onPointsChange,
  currency = 'RON',
}: PointsCheckoutSelectorProps) {
  if (rewards.length === 0 || userPoints <= 0) return null;

  const availableRewards = rewards.filter((r) => r.pointsCost <= userPoints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 rounded-xl overflow-hidden border border-reward/40 bg-reward-surface"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-reward/20 via-reward-accent/10 to-reward/15 border-b border-reward/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-reward via-reward to-reward-accent flex items-center justify-center shadow-md shadow-reward/40">
            <Gift className="h-4 w-4 text-reward-surface-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-reward-surface-foreground">Folosește punctele tale</p>
            <p className="text-xs text-reward-light/80">Aplică o reducere din punctele acumulate</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-reward-foreground/40 border border-reward/40 rounded-full px-3 py-1">
          <Coins className="h-3.5 w-3.5 text-reward" />
          <span className="text-sm font-bold streak-shimmer text-reward-surface-foreground">{userPoints}</span>
          <span className="text-xs text-reward-light/80">pt</span>
        </div>
      </div>

      {/* Reward options */}
      <div className="p-4 space-y-2">
        {/* No points option */}
        <button
          type="button"
          onClick={() => onPointsChange(undefined)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 text-left',
            !formData.pointsToUse
              ? 'border-reward/60 bg-reward-foreground/40 shadow-md shadow-reward/20'
              : 'border-reward-surface-foreground/10 bg-reward-surface-foreground/5 hover:border-reward/40 hover:bg-reward/5'
          )}
        >
          <div className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
            !formData.pointsToUse
              ? 'border-reward bg-reward'
              : 'border-reward-surface-foreground/30'
          )}>
            {!formData.pointsToUse && <Check className="h-3 w-3 text-reward-foreground" />}
          </div>
          <span className={cn(
            'text-sm font-medium',
            !formData.pointsToUse ? 'text-reward-surface-foreground' : 'text-reward-light/80'
          )}>
            Nu folosi puncte
          </span>
        </button>

        {/* Reward tiers */}
        {availableRewards.map((r) => {
          const isSelected = formData.pointsToUse === r.pointsCost;
          return (
            <motion.button
              key={r.id}
              type="button"
              onClick={() => onPointsChange(r.pointsCost)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 text-left relative overflow-hidden',
                isSelected
                  ? 'border-reward/80 bg-gradient-to-r from-reward/20 to-reward/10 shadow-lg shadow-reward/30'
                  : 'border-reward-surface-foreground/10 bg-reward-surface-foreground/5 hover:border-reward/60 hover:bg-reward/5'
              )}
            >
              {/* Shine on selected */}
              {isSelected && (
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <div className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-reward/10 to-transparent animate-streak-shine" />
                </div>
              )}

              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors relative z-10',
                isSelected
                  ? 'border-reward bg-reward'
                  : 'border-reward-surface-foreground/30'
              )}>
                {isSelected && <Check className="h-3 w-3 text-reward-foreground" />}
              </div>

              <div className="flex-1 relative z-10">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-sm font-semibold',
                    isSelected ? 'text-reward-surface-foreground' : 'text-reward-surface-foreground/80'
                  )}>
                    {r.pointsCost} puncte
                  </span>
                  <span className={cn(
                    'text-sm font-bold',
                    isSelected ? 'streak-shimmer text-reward' : 'text-reward/80'
                  )}>
                    -{r.discountAmount} {currency}
                  </span>
                </div>
              </div>

              {isSelected && (
                <Sparkles className="h-4 w-4 text-reward/60 streak-sparkle relative z-10 flex-shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected feedback */}
      <AnimatePresence>
        {formData.pointsToUse && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-reward/10 border-t border-reward/15 flex items-center justify-between">
              <span className="text-xs text-reward/70">Reducere aplicată</span>
              <span className="text-sm font-bold text-reward">
                -{rewards.find((r) => r.pointsCost === formData.pointsToUse)?.discountAmount ?? 0} {currency}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
