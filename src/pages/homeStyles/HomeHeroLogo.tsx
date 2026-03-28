/**
 * Logo / marcă vizuală deasupra titlului hero — stilizat per variantă Home.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, UtensilsCrossed, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';

export type HomeHeroLogoVariant = 'gamified' | 'friendly' | 'premium' | 'clean';

export function HomeHeroLogo({
  variant,
  align = 'center',
}: {
  variant: HomeHeroLogoVariant;
  align?: 'center' | 'start';
}) {
  const label = texts.app.name;

  const wrap = (inner: React.ReactNode) => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'mb-6',
        align === 'center' && 'flex justify-center',
        align === 'start' && 'flex justify-start'
      )}
    >
      {inner}
    </motion.div>
  );

  if (variant === 'gamified') {
    return wrap(
      <div
        className="inline-flex h-16 w-16 md:h-[4.5rem] md:w-[4.5rem] items-center justify-center rounded-2xl bg-primary-foreground/15 text-primary-foreground shadow-lg ring-1 ring-primary-foreground/20"
        aria-label={label}
        role="img"
      >
        <Zap className="h-9 w-9 md:h-10 md:w-10" strokeWidth={1.6} />
      </div>
    );
  }

  if (variant === 'friendly') {
    return wrap(
      <div
        className="inline-flex h-16 w-16 md:h-[4.5rem] md:w-[4.5rem] items-center justify-center rounded-2xl bg-primary/10 text-primary border-2 border-primary/25 shadow-md"
        aria-label={label}
        role="img"
      >
        <UtensilsCrossed className="h-8 w-8 md:h-9 md:w-9" strokeWidth={1.75} />
      </div>
    );
  }

  if (variant === 'premium') {
    return wrap(
      <div
        className="inline-flex h-16 w-16 md:h-[4.5rem] md:w-[4.5rem] items-center justify-center rounded-[1.75rem] border border-border/35 bg-background/75 backdrop-blur-xl text-primary shadow-[0_8px_32px_hsl(var(--primary)/0.14)]"
        aria-label={label}
        role="img"
      >
        <Crown className="h-8 w-8 md:h-9 md:w-9" strokeWidth={1.5} />
      </div>
    );
  }

  // clean
  return wrap(
    <div
      className="inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-lg border border-border/60 text-foreground/80 bg-muted/30"
      aria-label={label}
      role="img"
    >
      <UtensilsCrossed className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.65} />
    </div>
  );
}
