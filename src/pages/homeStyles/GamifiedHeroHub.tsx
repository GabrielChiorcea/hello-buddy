/**
 * GamifiedHeroHub — Combined hero + tier progress + education section.
 * Authenticated: logo, points summary, accordion (Rank, Benefits).
 * Guest: logo, title + quick CTA to catalog.
 * When tiers disabled: logo + points education only.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Star, Gift, TrendingUp, ChevronRight, Sparkles, ShoppingBag, ShoppingCart } from 'lucide-react';
import { AnimatedCtaArrows } from '@/components/common/AnimatedCtaArrows';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { TierIcon } from '@/config/tierIcons';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import { useTierDisplayData } from '@/components/layout/tierStyles/shared';
import { FreeProductsTierGrid } from '@/components/layout/tierStyles/FreeProductsTierGrid';
import { HomeHeroLogo } from './HomeHeroLogo';
import { FreeCampaignUrgencyBanner } from './FreeCampaignUrgencyBanner';
import { HeroStoryConnector } from './HeroStoryConnector';

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Set `true` to show the Benefits / How it works accordion in the gamified hero. */
const SHOW_HERO_ACCORDION = false;

/** High-contrast accordion triggers: large tap target, clear border, visible focus for a11y */
const heroAccordionTriggerClass = cn(
  'min-h-[48px] sm:min-h-[52px] rounded-xl border-2 border-primary-foreground/50 bg-primary-foreground/22',
  'px-2.5 py-3 sm:px-4 sm:py-3.5 text-sm sm:text-base font-bold text-primary-foreground shadow-md transition-colors',
  'hover:bg-primary-foreground/32 hover:border-primary-foreground/65 hover:no-underline',
  'data-[state=open]:border-primary-foreground/75 data-[state=open]:bg-primary-foreground/30',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--primary))]',
  '[&>svg:last-child]:h-5 [&>svg:last-child]:w-5 [&>svg:last-child]:text-primary-foreground [&>svg:last-child]:opacity-100',
);

/* ── Gradient progress bar (reused from gamifiedTier) ── */
const GradientBar: React.FC<{ percent: number }> = ({ percent }) => (
  <div className="relative h-2 w-full min-w-0 overflow-hidden rounded-full bg-primary-foreground/15">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${percent}%` }}
      transition={{ duration: 0.8, ease: easeOut }}
      className="absolute inset-y-0 left-0 rounded-full bg-primary-foreground/80"
    />
    <div
      className="absolute inset-y-0 w-1/3 rounded-full opacity-20"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
        animation: 'shimmer-sweep 2.5s ease-in-out infinite',
      }}
    />
  </div>
);

/* ── Main component ── */
export const GamifiedHeroHub: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((s) => s.user);
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');
  const { enabled: pointsEnabled } = usePluginEnabled('points');
  const tierData = useTierDisplayData();

  const pointsBalance = user?.pointsBalance ?? 0;

  return (
    <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 overflow-hidden text-primary-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className="container mx-auto px-4 relative">
        {/* Top: logo în hero doar pe mobil (< md); pe desktop logo-ul e în navbar (VITE_APP_LOGO_URL). */}
        <div className="pt-12 md:pt-16 pb-4">
          <div className="text-center">
          {isAuthenticated && user ? (
            <>
              {pointsEnabled ? (
                <div className="mb-2 flex w-full max-w-full flex-nowrap items-center gap-2 sm:gap-3 md:justify-center">
                  <div className="flex min-w-0 flex-1 items-center md:hidden">
                    <HomeHeroLogo variant="gamified" inline inlineFillRow />
                  </div>
                  <motion.div
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-bold sm:gap-2 sm:px-4 sm:text-sm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  >
                    <Star className="h-4 w-4 fill-current" />
                    {pointsBalance > 0
                      ? `${texts.home.heroPointsLabel.replace('{count}', String(pointsBalance))} ${texts.home.heroPointsAvailable}`
                      : texts.home.heroEarnPoints}
                  </motion.div>
                </div>
              ) : (
                <div className="md:hidden">
                  <HomeHeroLogo variant="gamified" align="center" />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="md:hidden">
                <HomeHeroLogo variant="gamified" align="center" />
              </div>
              <motion.h1
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: easeOut }}
              >
                {texts.home.heroTitle}
              </motion.h1>
            </>
          )}
          </div>
        </div>

        {/* ─── Authenticated: Tier accordion ─── */}
        {isAuthenticated && tiersEnabled && tierData && (
          <motion.div
            className="max-w-3xl mx-auto pb-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Compact rank bar (always visible) */}
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl border border-primary-foreground/15 p-4 mb-1">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
                  <span className="text-xl leading-none">{tierData.currentBadgeIcon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-bold truncate">{tierData.tierName}</span>
                    {!tierData.isMaxLevel && tierData.nextTierThreshold && (
                      <span className="text-xs text-primary-foreground/70 tabular-nums">
                        {texts.home.heroXpProgress
                          .replace('{current}', String(tierData.currentXp))
                          .replace('{target}', String(tierData.nextTierThreshold))}
                      </span>
                    )}
                    <span className="text-[10px] font-bold bg-primary-foreground/20 rounded-full px-2 py-0.5">
                      x{tierData.multiplier.toFixed(1)}
                    </span>
                    {tierData.isMaxLevel && (
                      <span className="text-[10px] font-bold bg-primary-foreground/25 rounded-full px-2 py-0.5 flex items-center gap-0.5">
                        <Sparkles className="h-2.5 w-2.5" /> MAX
                      </span>
                    )}
                  </div>
                  {tierData.isMaxLevel && (
                    <p className="text-xs text-primary-foreground/80 font-medium mt-0.5">{texts.home.heroMaxLevel}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <GradientBar percent={tierData.progressPercent} />
                    </div>
                    {!tierData.isMaxLevel && tierData.xpToNextLevel != null && (
                      <span className="shrink-0 text-[10px] font-medium tabular-nums text-primary-foreground/65">
                        {texts.home.heroXpRemaining.replace('{count}', String(tierData.xpToNextLevel))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Free products — always visible (not only inside accordion) */}
            {tierData.hasFreeProductBenefits && (
              <div
                className={cn(
                  'rounded-xl border-2 border-white/60 bg-white p-3 shadow-lg',
                  tierData.freeProductCampaignsSummary.length > 0 ? 'mb-0' : 'mb-3',
                )}
              >
                <p className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                  <Gift className="h-5 w-5 shrink-0 self-start mt-0.5" aria-hidden />
                  {texts.freeProducts.availableOnlyForYourRank}
                </p>
                <FreeProductsTierGrid summaries={tierData.freeProductCampaignsSummary} />
              </div>
            )}

            {tierData.hasFreeProductBenefits && tierData.freeProductCampaignsSummary.length > 0 && (
              <>
                <HeroStoryConnector />
                <FreeCampaignUrgencyBanner
                  campaigns={tierData.freeProductCampaignsSummary}
                  className={cn('mt-4', !tierData.isMaxLevel ? '!mb-0' : undefined)}
                  action={
                    !tierData.isMaxLevel ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        asChild
                        className="w-full justify-center rounded-full font-bold text-xs shadow-sm sm:w-auto"
                      >
                        <Link to={routes.catalog} className="flex items-center gap-2">
                          <ShoppingBag className="h-3.5 w-3.5" />
                          {texts.home.heroOrderForXp}
                          <AnimatedCtaArrows />
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              </>
            )}

            {/* Accordion — Benefits / How it works (disabled for layout preview; set SHOW_HERO_ACCORDION true to restore) */}
            {SHOW_HERO_ACCORDION && (
            <Accordion
              type="single"
              collapsible
              className={cn(
                'grid grid-cols-2 gap-x-2 gap-y-2 sm:gap-x-3',
                /* Row 1: triggers (Item > h3) */
                '[&>div:nth-child(1)>h3]:col-start-1 [&>div:nth-child(1)>h3]:row-start-1',
                '[&>div:nth-child(2)>h3]:col-start-2 [&>div:nth-child(2)>h3]:row-start-1',
                /* Row 2: panel full width of section (Items use display:contents; panels share row 2) */
                '[&>div:nth-child(1)>*:last-child]:col-span-2 [&>div:nth-child(1)>*:last-child]:row-start-2 [&>div:nth-child(1)>*:last-child]:w-full [&>div:nth-child(1)>*:last-child]:min-w-0',
                '[&>div:nth-child(2)>*:last-child]:col-span-2 [&>div:nth-child(2)>*:last-child]:row-start-2 [&>div:nth-child(2)>*:last-child]:w-full [&>div:nth-child(2)>*:last-child]:min-w-0',
              )}
            >
              {/* Benefits — `contents` lets triggers + panels participate in parent grid */}
              <AccordionItem value="benefits" className="contents border-0">
                <AccordionTrigger className={cn(heroAccordionTriggerClass, 'text-left')}>
                  <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <Gift className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
                    <span className="min-w-0 leading-tight">{texts.home.heroBenefits}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="rounded-xl border-2 border-primary-foreground/35 bg-primary-foreground/10 px-4 pb-4 pt-3 text-sm text-primary-foreground/95 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Zap className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                      <span className="leading-relaxed">{tierData.currentBenefit}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <TrendingUp className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                      <span className="leading-relaxed">{tierData.xpFormulaText}</span>
                    </div>
                    {tierData.hasFreeProductBenefits ? (
                      <p className="leading-relaxed text-primary-foreground/95">{texts.home.heroFreeProductsSeeAbove}</p>
                    ) : (
                      <p className="text-sm leading-relaxed text-primary-foreground/75">{texts.home.heroNoFreeProducts}</p>
                    )}
                    {!tierData.isMaxLevel && tierData.nextTier && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-primary-foreground/20 pt-3 text-sm">
                        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="text-primary-foreground/80">{texts.home.heroUnlocks}</span>
                        <TierIcon badgeIcon={tierData.nextTier.badgeIcon} tierLabel={tierData.nextTier.name} size={16} className="inline" />
                        <span className="font-semibold">{tierData.nextTier.name}</span>
                        <span className="ml-auto text-xs font-bold tabular-nums">x{tierData.nextMultiplier.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* How it works — same `contents` layout as Benefits (full-width panel row) */}
              <AccordionItem value="how" className="contents border-0">
                <AccordionTrigger className={cn(heroAccordionTriggerClass, 'text-left')}>
                  <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <TrendingUp className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
                    <span className="min-w-0 leading-tight">{texts.home.heroHowItWorks}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="rounded-xl border-2 border-primary-foreground/35 bg-primary-foreground/10 px-4 pb-4 pt-3 text-sm text-primary-foreground/95 shadow-sm">
                  <div className="space-y-3">
                    <p className="flex items-start gap-3 leading-relaxed">
                      <ShoppingCart className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                      {texts.home.heroHowPointsWork}
                    </p>
                    <p className="flex items-start gap-3 leading-relaxed">
                      <TrendingUp className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                      {texts.home.heroHowRanksWork}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            )}

            {/* CTA separat doar dacă nu e deja în bannerul de urgență */}
            {!tierData.isMaxLevel &&
              !(tierData.hasFreeProductBenefits && tierData.freeProductCampaignsSummary.length > 0) && (
                <div className="mt-3 text-center">
                  <Button size="sm" variant="secondary" asChild className="rounded-full font-bold text-xs">
                    <Link to={routes.catalog} className="flex items-center gap-2">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {texts.home.heroOrderForXp}
                      <AnimatedCtaArrows />
                    </Link>
                  </Button>
                </div>
              )}
          </motion.div>
        )}

        {/* ─── Authenticated but tiers disabled: just points education ─── */}
        {isAuthenticated && !tiersEnabled && pointsEnabled && (
          <motion.div
            className="max-w-md mx-auto pb-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-primary-foreground/80 mb-3">{texts.home.heroEarnPointsDesc}</p>
            <Button size="sm" variant="secondary" asChild className="rounded-full font-bold text-xs">
              <Link to={routes.catalog} className="flex items-center gap-2">
                <ShoppingBag className="h-3.5 w-3.5" />
                {texts.home.orderNow}
                <AnimatedCtaArrows />
              </Link>
            </Button>
          </motion.div>
        )}

        {/* ─── Guest: simple CTA (tier teaser moved to Welcome) ─── */}
        {!isAuthenticated && (
          <div className="pb-10 text-center">
            <motion.p
              className="text-lg text-primary-foreground/80 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {texts.app.tagline}
            </motion.p>
            <Button size="lg" variant="secondary" asChild className="rounded-xl font-bold">
              <Link to={routes.catalog} className="flex items-center gap-2">
                {texts.home.orderNow}
                <AnimatedCtaArrows size="md" className="ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
