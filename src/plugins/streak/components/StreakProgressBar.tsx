/**
 * Progress bar for streak campaign (X / Y days)
 * Plugin: plugins/streak
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface StreakProgressBarProps {
  current: number;
  required: number;
  completed?: boolean;
  className?: string;
}

export const StreakProgressBar: React.FC<StreakProgressBarProps> = ({
  current,
  required,
  completed = false,
  className,
}) => {
  const value = required > 0 ? Math.min(100, (current / required) * 100) : 0;
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {current} / {required} zile
        </span>
        {completed && <span className="text-primary font-medium">Complet!</span>}
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
};
