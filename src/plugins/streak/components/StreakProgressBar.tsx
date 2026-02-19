/**
 * Progress bar for streak campaign (X / Y with label by streakType)
 * Plugin: plugins/streak
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { StreakType } from '../types';

export interface StreakProgressBarProps {
  current: number;
  required: number;
  completed?: boolean;
  streakType?: StreakType;
  className?: string;
}

function getProgressLabel(streakType: StreakType | undefined): string {
  switch (streakType) {
    case 'consecutive_days':
      return 'zile consecutive';
    case 'days_per_week':
      return 'zile';
    case 'working_days':
      return 'zile lucrătoare';
    default:
      return 'zile';
  }
}

export const StreakProgressBar: React.FC<StreakProgressBarProps> = ({
  current,
  required,
  completed = false,
  streakType,
  className,
}) => {
  const value = required > 0 ? Math.min(100, (current / required) * 100) : 0;
  const label = getProgressLabel(streakType);
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {current} / {required} {label}
        </span>
        {completed && <span className="text-primary font-medium">Complet!</span>}
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
};
