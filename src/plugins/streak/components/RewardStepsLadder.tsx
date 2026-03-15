import React from 'react';
import { Check, Star } from 'lucide-react';
import type { RewardStep } from '../types';
import type { ComponentStyleName } from '@/config/componentStyle';
import { cn } from '@/lib/utils';

interface RewardStepsLadderProps {
  steps: RewardStep[] | null | undefined;
  currentCount: number | null;
  styleName: ComponentStyleName;
  bonusPoints?: number;
  completed?: boolean;
}

export const RewardStepsLadder: React.FC<RewardStepsLadderProps> = ({
  steps,
  currentCount,
  styleName,
  bonusPoints,
  completed,
}) => {
  if (!steps || steps.length === 0) return null;

  const sortedSteps = steps.slice().sort((a, b) => a.stepNumber - b.stepNumber);
  const effectiveCurrent = currentCount ?? 0;
  const manySteps = sortedSteps.length > 4;

  const baseColorsByStyle: Record<ComponentStyleName, {
    track: string;
    reachedTrack: string;
    dot: string;
    dotReached: string;
    label: string;
    labelReached: string;
    points: string;
    pointsReached: string;
  }> = {
    gamified: {
      track: 'bg-reward-surface-foreground/10',
      reachedTrack: 'bg-reward/50',
      dot: 'border-reward/40 bg-reward-surface',
      dotReached: 'bg-reward shadow-md shadow-reward/40',
      label: 'text-reward-surface-foreground/60',
      labelReached: 'text-reward',
      points: 'text-reward-surface-foreground/40',
      pointsReached: 'text-reward',
    },
    premium: {
      track: 'bg-border/60',
      reachedTrack: 'bg-primary/60',
      dot: 'border-border bg-background',
      dotReached: 'bg-primary',
      label: 'text-muted-foreground/60',
      labelReached: 'text-foreground',
      points: 'text-muted-foreground/40',
      pointsReached: 'text-primary',
    },
    clean: {
      track: 'bg-muted',
      reachedTrack: 'bg-primary/70',
      dot: 'border-border bg-card',
      dotReached: 'bg-primary',
      label: 'text-muted-foreground',
      labelReached: 'text-foreground',
      points: 'text-muted-foreground/60',
      pointsReached: 'text-primary',
    },
    friendly: {
      track: 'bg-accent/60',
      reachedTrack: 'bg-primary/70',
      dot: 'border-accent bg-card',
      dotReached: 'bg-primary',
      label: 'text-foreground/70',
      labelReached: 'text-primary',
      points: 'text-foreground/60',
      pointsReached: 'text-primary',
    },
  };

  const colors = baseColorsByStyle[styleName];

  /* Gamified: step nodes (circles) + connecting lines + final star */
  if (styleName === 'gamified') {
    return (
      <div className={cn('relative', manySteps && 'overflow-x-auto -mx-1 px-1 scrollbar-none')}>
        <div className={cn('min-w-full', manySteps && 'min-w-max')}>
          <div className="flex flex-col gap-3">
            <div className="flex items-start w-full">
              {sortedSteps.map((step, idx) => {
                const reached = effectiveCurrent >= step.stepNumber;
                const label = step.label || `La a ${step.stepNumber}-a comandă`;
                return (
                  <React.Fragment key={step.stepNumber}>
                    {idx > 0 && (
                      <div
                        className={cn(
                          'h-0.5 flex-1 min-w-[8px] rounded-full mt-4 self-center',
                          reached ? 'gamified-step-connector-done' : 'gamified-step-connector-pending'
                        )}
                      />
                    )}
                    <div className={cn('flex flex-col items-center flex-1 min-w-0', manySteps && 'min-w-[60px]')}>
                      <div
                        className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2',
                          reached ? 'gamified-step-done' : 'gamified-step-pending'
                        )}
                      >
                        {reached ? <Check className="h-4 w-4" /> : <span className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                      </div>
                      <span className={cn('mt-1 leading-snug line-clamp-2 max-w-[90px] text-center text-[10px] sm:text-xs gamified-casino-badge-label', reached ? 'text-reward-surface-foreground' : 'text-reward-surface-foreground/70')} title={label}>
                        {label}
                      </span>
                      <span className={cn('mt-0.5 font-semibold tabular-nums text-[10px] sm:text-xs', reached ? 'text-reward-light' : 'text-reward-surface-foreground/60')}>
                        +{step.pointsAwarded} pt
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
              <div className={cn('flex-1 min-w-[8px] h-0.5 rounded-full mt-4 self-center gamified-step-connector-pending')} />
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center gamified-step-final">
                  <Star className="h-4 w-4" />
                </div>
              </div>
            </div>

            {bonusPoints && bonusPoints > 0 && (
              <div className="flex justify-center">
                <span className={cn('mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium tabular-nums', completed ? 'bg-success/20 text-success' : 'text-reward-surface-foreground/80 bg-reward-surface-foreground/10')}>
                  Bonus completare: +{bonusPoints} pt
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', manySteps ? 'overflow-x-auto -mx-1 px-1 scrollbar-none' : '')}>
      <div className={cn('min-w-full', manySteps && 'min-w-max')}>
        <div className="flex flex-col gap-3">
          {/* Track + dots */}
          <div className="relative px-2">
            <div className={cn('h-1 rounded-full w-full', colors.track)}>
              <div
                className={cn('h-1 rounded-full', colors.reachedTrack)}
                style={{
                  width: `${Math.min(100, (effectiveCurrent / (sortedSteps[sortedSteps.length - 1]?.stepNumber || 1)) * 100)}%`,
                }}
              />
            </div>
            <div className={cn('absolute left-2 right-2 top-1/2 -translate-y-1/2 flex', manySteps ? 'gap-4' : 'justify-between')}>
              {sortedSteps.map((step) => {
                const reached = effectiveCurrent >= step.stepNumber;
                return (
                  <div key={step.stepNumber} className={cn('flex flex-col items-center', manySteps && 'min-w-[60px]')}>
                    <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors', reached ? colors.dotReached : colors.dot)}>
                      <span className="block w-1.5 h-1.5 rounded-full bg-background/80" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Labels under dots */}
          <div className={cn('flex text-[10px] sm:text-xs', manySteps ? 'gap-4 px-1' : 'justify-between px-1')}>
            {sortedSteps.map((step) => {
              const reached = effectiveCurrent >= step.stepNumber;
              const label = step.label || `La a ${step.stepNumber}-a comandă`;
              return (
                <div key={step.stepNumber} className={cn('flex flex-col items-center text-center', manySteps && 'min-w-[72px]')}>
                  <span className={cn('leading-snug line-clamp-2 max-w-[90px]', reached ? colors.labelReached : colors.label)} title={label}>{label}</span>
                  <span className={cn('mt-0.5 font-semibold tabular-nums', reached ? colors.pointsReached : colors.points)}>+{step.pointsAwarded} pt</span>
                </div>
              );
            })}
          </div>

          {bonusPoints && bonusPoints > 0 && (
            <div className="flex justify-center">
              <span className={cn('mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium tabular-nums', completed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
                Bonus completare: +{bonusPoints} pt
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

