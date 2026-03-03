/**
 * Casino-style segmented progress bar with glowing checkpoints
 * Plugin: plugins/streak
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { StreakType } from '../types';
import { motion } from 'framer-motion';
import { Star, Trophy, Zap } from 'lucide-react';

export interface StreakProgressBarProps {
  current: number;
  required: number;
  completed?: boolean;
  streakType?: StreakType;
  className?: string;
}

function getProgressLabel(streakType: StreakType | undefined): string {
  switch (streakType) {
    case 'consecutive_days': return 'zile consecutive';
    case 'days_per_week': return 'zile';
    case 'working_days': return 'zile lucrătoare';
    default: return 'zile';
  }
}

export const StreakProgressBar: React.FC<StreakProgressBarProps> = ({
  current,
  required,
  completed = false,
  streakType,
  className,
}) => {
  const label = getProgressLabel(streakType);
  const segments = Array.from({ length: required }, (_, i) => i < current);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Counter display */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black streak-shimmer streak-bonus-enter">
            {current}
          </span>
          <span className="text-lg text-amber-400/70 font-medium">/ {required}</span>
          <span className="text-xs text-amber-400/50 ml-1">{label}</span>
        </div>
        {completed && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-amber-500/30"
          >
            <Trophy className="h-3.5 w-3.5" />
            COMPLET!
          </motion.div>
        )}
      </div>

      {/* Segmented progress bar */}
      <div className="flex gap-1 items-center">
        {segments.map((filled, i) => (
          <React.Fragment key={i}>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.08, duration: 0.3, ease: 'easeOut' }}
              className="relative flex-1 h-3 rounded-full overflow-hidden"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-white/10 rounded-full" />
              {/* Fill */}
              {filled && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: i * 0.08 + 0.1, duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
                >
                  {/* Shine overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
                </motion.div>
              )}
            </motion.div>
            {/* Checkpoint diamond at milestones */}
            {i < required - 1 && (i + 1) % Math.max(1, Math.floor(required / 3)) === 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.08 + 0.2, type: 'spring' }}
                className={cn(
                  'w-4 h-4 rotate-45 rounded-sm flex-shrink-0 border',
                  filled
                    ? 'bg-amber-400 border-amber-300 shadow-lg shadow-amber-500/50 streak-checkpoint-active'
                    : 'bg-white/10 border-white/20'
                )}
              />
            )}
          </React.Fragment>
        ))}
        {/* Final trophy checkpoint */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: required * 0.08, type: 'spring' }}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2',
            completed
              ? 'bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-300 shadow-lg shadow-amber-500/50 streak-glow'
              : 'bg-white/5 border-white/20'
          )}
        >
          {completed ? (
            <Star className="h-4 w-4 text-black fill-black" />
          ) : (
            <Star className="h-4 w-4 text-white/30" />
          )}
        </motion.div>
      </div>

      {/* Motivational micro-text */}
      {!completed && current > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-xs text-amber-400/60"
        >
          <Zap className="h-3 w-3" />
          {current >= required - 1
            ? 'Ultima zi! Mai ai un efort!'
            : `Încă ${required - current} ${required - current === 1 ? 'zi' : 'zile'} până la premiu`
          }
        </motion.div>
      )}
    </div>
  );
};
