/**
 * Logo / marcă vizuală deasupra titlului hero — stilizat per variantă Home.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, UtensilsCrossed, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';
import { BRANDING_LOGO_URL } from '@/config/branding';

export type HomeHeroLogoVariant = 'gamified' | 'friendly' | 'premium' | 'clean';

export function HomeHeroLogo({
  variant,
  align = 'center',
  showWordmark = false,
  inline = false,
  inlineFillRow = false,
  compactMobileSpacing = false,
}: {
  variant: HomeHeroLogoVariant;
  align?: 'center' | 'start';
  /** Icon + app name pe un rând (logo de brand) */
  showWordmark?: boolean;
  /** Icon compact, fără margin jos — pentru același rând cu pill / alte elemente */
  inline?: boolean;
  /** Cu logo imagine: ocupă tot `w` disponibil în rând (flex), până la `max-h` — doar mobil/hero */
  inlineFillRow?: boolean;
  /** Reduce spațiul vertical pe mobil (utile pentru guest hero) */
  compactMobileSpacing?: boolean;
}) {
  const label = texts.app.name;

  const wrap = (inner: React.ReactNode, opts?: { inline?: boolean; fillRow?: boolean }) => {
    const isInline = opts?.inline ?? false;
    const fillRow = opts?.fillRow ?? false;
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          isInline && fillRow && 'mb-0 flex min-w-0 w-full flex-1 items-center',
          isInline && !fillRow && 'mb-0 inline-flex',
          !isInline && (compactMobileSpacing ? 'mb-3 md:mb-6' : 'mb-6'),
          !isInline && align === 'center' && 'flex justify-center',
          !isInline && align === 'start' && 'flex justify-start'
        )}
      >
        {inner}
      </motion.div>
    );
  };

  if (variant === 'gamified') {
    /** Logo imagine: fără chenar — doar asset-ul. Icon Lucide: păstrăm „badge”-ul. */
    const glyph = (imgClass: string) =>
      BRANDING_LOGO_URL ? (
        <img
          src={BRANDING_LOGO_URL}
          alt=""
          className={cn(imgClass, 'object-contain')}
          draggable={false}
        />
      ) : (
        <Zap className={imgClass} strokeWidth={1.6} />
      );

    const markBoxClass =
      'inline-flex h-12 w-12 shrink-0 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-primary-foreground/15 text-primary-foreground shadow-lg ring-1 ring-primary-foreground/20';

    const mark =
      BRANDING_LOGO_URL ? (
        <img
          src={BRANDING_LOGO_URL}
          alt=""
          className="h-24 w-24 shrink-0 object-contain md:h-32 md:w-32 lg:h-36 lg:w-36"
          aria-hidden={showWordmark}
          draggable={false}
        />
      ) : (
        <div
          className={markBoxClass}
          aria-hidden={showWordmark}
          aria-label={showWordmark ? undefined : label}
          role={showWordmark ? undefined : 'img'}
        >
          {glyph('h-7 w-7 md:h-8 md:w-8')}
        </div>
      );

    if (showWordmark) {
      return wrap(
        <div className="inline-flex items-center gap-2.5 md:gap-3">
          {mark}
          <span className="text-xl md:text-2xl font-extrabold tracking-tight text-primary-foreground leading-none">
            {label}
          </span>
        </div>
      );
    }

    if (inline) {
      if (BRANDING_LOGO_URL && inlineFillRow) {
        return wrap(
          <img
            src={BRANDING_LOGO_URL}
            alt={label}
            className="h-auto w-full max-h-32 object-contain object-left sm:max-h-40 md:max-h-44"
            draggable={false}
          />,
          { inline: true, fillRow: true }
        );
      }
      if (BRANDING_LOGO_URL) {
        return wrap(
          <img
            src={BRANDING_LOGO_URL}
            alt={label}
            className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
            draggable={false}
          />,
          { inline: true }
        );
      }
      return wrap(
        <div
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 text-primary-foreground shadow-md ring-1 ring-primary-foreground/20 sm:h-10 sm:w-10"
          aria-label={label}
          role="img"
        >
          {glyph('h-5 w-5 sm:h-6 sm:w-6')}
        </div>,
        { inline: true }
      );
    }

    if (BRANDING_LOGO_URL) {
      return wrap(
        <img
          src={BRANDING_LOGO_URL}
          alt={label}
          className="mx-auto h-20 w-56 max-w-[min(92vw,28rem)] object-contain sm:h-64 sm:w-64 md:h-80 md:w-80 md:max-w-[min(88vw,36rem)] lg:h-96 lg:w-96 xl:h-[28rem] xl:w-[28rem]"
          draggable={false}
        />
      );
    }

    return wrap(
      <div
        className="inline-flex h-16 w-16 md:h-[4.5rem] md:w-[4.5rem] items-center justify-center rounded-2xl bg-primary-foreground/15 text-primary-foreground shadow-lg ring-1 ring-primary-foreground/20"
        aria-label={label}
        role="img"
      >
        {glyph('h-9 w-9 md:h-10 md:w-10')}
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
