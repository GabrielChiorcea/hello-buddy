/**
 * Style-aware segmented progress bar
 * Plugin: plugins/streak
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { RecurrenceType, RewardStep } from '../types';
import { motion } from 'framer-motion';
import { Star, Trophy, Zap, Check } from 'lucide-react';
import { useComponentStyle } from '@/config/componentStyle';
import { texts } from '@/config/texts';

export interface StreakProgressBarProps {
  current: number;
  required: number;
  completed?: boolean;
  recurrenceType?: RecurrenceType;
  rewardSteps?: RewardStep[];
  className?: string;
  variant?: 'default' | 'inline';
}

function getProgressLabel(recurrenceType: RecurrenceType | undefined): string {
  switch (recurrenceType) {
    case 'consecutive': return 'zile consecutive';
    case 'rolling': return 'zile';
    default: return 'zile';
  }
}

export const StreakProgressBar: React.FC<StreakProgressBarProps> = (props) => {
  if (props.variant === 'inline') return <InlineProgress {...props} />;
  const style = useComponentStyle();
  switch (style) {
    case 'clean': return <CleanProgress {...props} />;
    case 'premium': return <PremiumProgress {...props} />;
    case 'friendly': return <FriendlyProgress {...props} />;
    default: return <GamifiedProgress {...props} />;
  }
};

const InlineProgress: React.FC<StreakProgressBarProps> = ({
  current,
  required,
  completed = false,
  className,
}) => {
  const safeRequired = Math.max(1, required);
  const pct = Math.min(100, Math.max(0, (current / safeRequired) * 100));

  return (
    <div className={cn('w-full min-w-0', className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            completed ? 'bg-primary' : 'bg-reward'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {current}/{required} {texts.streak.preview.ordersLabel}
      </p>
    </div>
  );
};

/* ═══ Gamified — casino step nodes (circles) + connecting lines ═══ */
const GamifiedProgress: React.FC<StreakProgressBarProps> = ({
  current, required, completed = false, recurrenceType, rewardSteps = [], className,
}) => {
  const label = getProgressLabel(recurrenceType);
  const pct = Math.min(100, Math.round((current / required) * 100));
  const stepSet = new Map(rewardSteps.map((s) => [s.stepNumber, s]));

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hero: big counter + gold % */}
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-1.5">
          <span className="gamified-casino-counter streak-bonus-enter">{current}</span>
          <span className="gamified-casino-body text-lg">/ {required}</span>
          <span className="gamified-casino-body text-xs ml-1 opacity-80">{label}</span>
        </div>
        <span className="gamified-casino-pct tabular-nums">{pct}%</span>
      </div>
      {completed && (
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-reward to-reward-light text-reward-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-reward/40">
          <Trophy className="h-3.5 w-3.5" /> COMPLET!
        </motion.div>
      )}

      {/* Step nodes: circles connected by lines */}
      <div className="flex items-center w-full">
        {Array.from({ length: required + 1 }, (_, i) => {
          const isStep = i < required;
          const stepNum = i + 1;
          const filled = current >= stepNum;
          const isFinal = i === required;
          const stepReward = isStep ? stepSet.get(stepNum) : null;

          return (
            <React.Fragment key={i}>
              {/* Connector line before this node (except before first) */}
              {i > 0 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 min-w-[8px] rounded-full transition-colors',
                    filled ? 'gamified-step-connector-done' : 'gamified-step-connector-pending'
                  )}
                />
              )}

              {/* Node: circle */}
              {isFinal ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring' }}
                  className={cn(
                    'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
                    'gamified-step-final'
                  )}
                >
                  <Star className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring' }}
                  title={stepReward ? `Pas ${stepNum}: +${stepReward.pointsAwarded} puncte` : undefined}
                  className={cn(
                    'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2',
                    filled ? 'gamified-step-done' : 'gamified-step-pending'
                  )}
                >
                  {filled ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/45" />
                  )}
                </motion.div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {!completed && current > 0 && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 gamified-casino-body text-xs">
          <Zap className="h-3 w-3 text-reward" />
          {current >= required - 1 ? 'Ultima zi! Mai ai un efort!' : `Încă ${required - current} ${required - current === 1 ? 'zi' : 'zile'} până la premiu`}
        </motion.div>
      )}
    </div>
  );
};

/* ═══ Clean — simple progress bar ═══ */
const CleanProgress: React.FC<StreakProgressBarProps> = ({
  current, required, completed = false, recurrenceType, className,
}) => {
  const label = getProgressLabel(recurrenceType);
  const pct = Math.min(100, (current / required) * 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{current} / {required} <span className="text-muted-foreground text-xs">{label}</span></span>
        {completed && (
          <span className="text-xs font-medium text-primary flex items-center gap-1">
            <Check className="h-3 w-3" /> Complet
          </span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {!completed && current > 0 && (
        <p className="text-xs text-muted-foreground">
          Încă {required - current} {required - current === 1 ? 'zi' : 'zile'}
        </p>
      )}
    </div>
  );
};

/* ═══ Premium — refined thin bar ═══ */
const PremiumProgress: React.FC<StreakProgressBarProps> = ({
  current, required, completed = false, recurrenceType, className,
}) => {
  const label = getProgressLabel(recurrenceType);
  const pct = Math.min(100, (current / required) * 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground tracking-tight">
          <span className="text-lg font-semibold">{current}</span>
          <span className="text-muted-foreground/50 mx-1">/</span>
          <span className="text-muted-foreground/50">{required}</span>
          <span className="text-xs text-muted-foreground/40 ml-1.5 tracking-wide">{label}</span>
        </span>
        {completed && (
          <span className="text-xs text-primary font-medium tracking-wide uppercase">Completat</span>
        )}
      </div>
      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/* ═══ Friendly — fun progress with emoji ═══ */
const FriendlyProgress: React.FC<StreakProgressBarProps> = ({
  current, required, completed = false, recurrenceType, className,
}) => {
  const label = getProgressLabel(recurrenceType);
  const pct = Math.min(100, (current / required) * 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">
          {current} / {required} <span className="text-xs font-normal text-muted-foreground">{label}</span>
        </span>
        {completed && (
          <span className="text-xs font-bold text-primary">Bravo!</span>
        )}
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
      {!completed && current > 0 && (
        <p className="text-xs text-muted-foreground">
          Încă {required - current} {required - current === 1 ? 'zi' : 'zile'} până la premiu!
        </p>
      )}
    </div>
  );
};
