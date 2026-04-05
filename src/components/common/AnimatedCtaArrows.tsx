/**
 * Trei chevrons suprapuși cu animație decalată — efect > >> >>>.
 */
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const DELAY_MS = ['0ms', '120ms', '240ms'] as const;

export function AnimatedCtaArrows({
  className,
  size = 'sm',
}: {
  className?: string;
  /** sm: butoane hero mici; md: CTA guest mai mare */
  size?: 'sm' | 'md';
}) {
  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <span className={cn('inline-flex items-center', className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <ChevronRight
          key={i}
          className={cn(
            iconClass,
            'shrink-0 animate-cta-chevron-chase motion-reduce:animate-none',
            i > 0 && '-ml-2',
          )}
          style={{ animationDelay: DELAY_MS[i] }}
        />
      ))}
    </span>
  );
}
