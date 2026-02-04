/**
 * Loader component for loading states
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  className,
  fullScreen = false,
  text,
}) => {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Skeleton loader for content placeholders
const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-muted rounded', className)} />
);

// Full page loader
const PageLoader: React.FC = () => (
  <div className="flex min-h-[400px] items-center justify-center">
    <Loader size="lg" text={texts.common.loading} />
  </div>
);

export { Loader, SkeletonLoader, PageLoader };
