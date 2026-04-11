/**
 * GamifiedHeroHub — Combined hero + tier progress + education section.
 * Authenticated: logo, points summary, accordion (Rank, Benefits).
 * Guest: logo, title + quick CTA to catalog.
 * When tiers disabled: logo + points education only.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Sparkles, ShoppingBag } from 'lucide-react';
import { AnimatedCtaArrows } from '@/components/common/AnimatedCtaArrows';
import BonusBanner from '@/components/common/BonusBanner';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { Button } from '@/components/ui/button';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import { useTierDisplayData } from '@/components/layout/tierStyles/shared';
import { FreeProductsTierGrid } from '@/components/layout/tierStyles/FreeProductsTierGrid';
import { HomeHeroLogo } from './HomeHeroLogo';
import { FreeCampaignUrgencyBanner } from './FreeCampaignUrgencyBanner';
import { HeroStoryConnector } from './HeroStoryConnector';

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
      <div className="container relative mx-auto px-4 md:px-6 lg:px-8">
        {/* Top: logo în hero doar pe mobil (< md); pe desktop logo-ul e în navbar (VITE_APP_LOGO_URL). */}
        <div className="pb-4 pt-12 md:pb-6 md:pt-16 lg:pt-20">
          <div className="text-center">
          {isAuthenticated && user ? (
            <>
              {pointsEnabled ? (
                <div className="mb-2 flex w-full max-w-full flex-nowrap items-center gap-2 sm:gap-3 md:justify-center">
                  <div className="flex min-w-0 flex-1 items-center md:hidden">
                    <HomeHeroLogo variant="gamified" inline inlineFillRow />
                  </div>
                  <motion.div
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-bold sm:gap-2 sm:px-4 sm:text-sm md:gap-2.5 md:px-5 md:py-2 md:text-base"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  >
                    <Star className="h-4 w-4 shrink-0 fill-current md:h-5 md:w-5" />
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
                <HomeHeroLogo variant="gamified" align="center" compactMobileSpacing />
              </div>
            </>
          )}
          </div>
        </div>

        {/* ─── Authenticated: Tier accordion ─── */}
        {isAuthenticated && tiersEnabled && tierData && (
          <motion.div
            className="mx-auto max-w-3xl pb-8 md:max-w-4xl md:pb-12 lg:max-w-5xl"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Compact rank bar */}


            <div className="bg-white text-foreground rounded-2xl border border-primary/15 shadow-sm p-4 mb-1 md:rounded-3xl md:p-6 md:shadow-md">

  
  <div className="flex items-center gap-2 mb-4 md:mb-5 md:gap-3">
    <span className="text-[11px] font-semibold bg-primary/10 rounded-md px-2 py-0.5 text-primary md:text-sm md:rounded-lg md:px-3 md:py-1">
      {texts.home.heroPointsMultiplierChip.replace('{multiplier}', tierData.multiplier.toFixed(1))}
    </span>
    {tierData.isMaxLevel && (
      <span className="text-[11px] font-bold bg-primary/10 rounded-md px-2 py-0.5 flex items-center gap-1 text-primary md:text-sm md:rounded-lg md:px-3 md:py-1 md:gap-1.5">
        <Sparkles className="h-2.5 w-2.5 md:h-4 md:w-4" /> MAX
      </span>
    )}
    {!tierData.isMaxLevel && tierData.nextTierThreshold && (
      <span className="ml-auto text-[11px] tabular-nums text-muted-foreground md:text-sm">
        {tierData.currentXp} / {tierData.nextTierThreshold} XP
      </span>
    )}
  </div>

  {/* Timeline: curent → următor → (desktop) următorul */}
  {!tierData.isMaxLevel && (
    <div className="flex items-center gap-0.5 sm:gap-1 md:gap-3 min-w-0">
      {/* Nod curent */}
      <div className="flex flex-col items-center gap-1 md:gap-1.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary/15 ring-2 ring-primary/35 ring-offset-1 ring-offset-white flex items-center justify-center text-base md:w-12 md:h-12 md:ring-[3px] md:ring-offset-2">
          <span className="flex scale-100 items-center justify-center md:scale-[1.2]">
            {tierData.currentBadgeIcon}
          </span>
        </div>
        <span className="text-[9px] font-bold text-foreground whitespace-nowrap text-center max-w-[4.5rem] truncate md:max-w-[9rem] md:text-xs md:leading-snug">
          {tierData.tierName}
        </span>
      </div>

      {/* Connector cu progres (până la următorul rang) */}
      <div className="flex-1 flex flex-col gap-1 mb-4 mx-0.5 min-w-[2rem] md:mb-5 md:mx-1">
        <div className="h-[3px] rounded-full bg-primary/10 overflow-hidden md:h-1.5">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${tierData.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Următorul rang — „?” gri (mister), nu icon până nu e atins */}
      <div className="flex flex-col items-center gap-1 md:gap-1.5 shrink-0">
        <div
          className="w-8 h-8 rounded-full bg-muted/80 ring-2 ring-muted-foreground/20 ring-offset-2 ring-offset-white border border-dashed border-muted-foreground/35 flex items-center justify-center shadow-sm md:w-12 md:h-12 md:ring-[3px] md:ring-offset-[6px]"
          aria-label={texts.home.heroTierMysteryLabel}
          title={texts.home.heroTierMysteryLabel}
        >
          <span className="text-lg font-bold leading-none text-muted-foreground select-none md:text-2xl">?</span>
        </div>
        <span className="text-[9px] font-semibold text-primary whitespace-nowrap text-center md:text-xs">
          {texts.home.heroNextTierPointsLabel.replace('{multiplier}', tierData.nextMultiplier.toFixed(1))}
        </span>
      </div>

      {/* Al treilea rang — doar desktop, dacă există în listă */}
      {tierData.tierAfterNext && (
        <>
          <div className="hidden md:flex flex-1 flex-col gap-1 mb-5 mx-1 min-w-[2rem] max-w-[6rem]">
            <div className="h-1.5 rounded-full bg-primary/8 border border-dashed border-primary/30" />
          </div>
          <div className="hidden md:flex flex-col items-center gap-1.5 shrink-0">
            <div
              className="w-12 h-12 rounded-full bg-muted/80 border border-dashed border-muted-foreground/35 flex items-center justify-center shadow-sm"
              aria-label={texts.home.heroTierMysteryLabel}
              title={texts.home.heroTierMysteryLabel}
            >
              <span className="text-2xl font-bold leading-none text-muted-foreground select-none">?</span>
            </div>
            <span className="text-xs font-medium text-foreground/80 whitespace-nowrap text-center">
              {texts.home.heroNextTierPointsLabel.replace(
                '{multiplier}',
                tierData.tierAfterNext.pointsMultiplier.toFixed(1),
              )}
            </span>
          </div>
        </>
      )}
    </div>
  )}

  {tierData.isMaxLevel && (
    <p className="text-xs text-muted-foreground font-medium mt-3 pt-3 border-t border-border md:mt-4 md:pt-4 md:text-sm md:leading-relaxed">
      {texts.home.heroMaxLevel}
    </p>
  )}

</div>




            {/* Free products — always visible (not only inside accordion) */}
            {tierData.hasFreeProductBenefits && (
              <div
                className={cn(
                  'rounded-xl border-2 border-white/60 bg-white p-3 shadow-lg md:rounded-2xl md:p-5 md:shadow-xl',
                  tierData.freeProductCampaignsSummary.length > 0 ? 'mb-0' : 'mb-3',
                )}
              >
                <FreeProductsTierGrid summaries={tierData.freeProductCampaignsSummary} />
              </div>
            )}

            {tierData.hasFreeProductBenefits && tierData.freeProductCampaignsSummary.length > 0 && (
              <>
                <HeroStoryConnector />
                <FreeCampaignUrgencyBanner
                  campaigns={tierData.freeProductCampaignsSummary}
                  className={cn('mt-4 md:mt-6', !tierData.isMaxLevel ? '!mb-0' : undefined)}
                  action={
                    !tierData.isMaxLevel ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        asChild
                        className="w-full justify-center rounded-full font-bold text-xs shadow-sm sm:w-auto md:h-11 md:px-6 md:text-sm"
                      >
                        <Link to={routes.catalog} className="flex items-center gap-2">
                          <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          {texts.home.heroOrderForXp}
                          <AnimatedCtaArrows />
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              </>
            )}

            {/* CTA separat doar dacă nu e deja în bannerul de urgență */}
            {!tierData.isMaxLevel &&
              !(tierData.hasFreeProductBenefits && tierData.freeProductCampaignsSummary.length > 0) && (
                <div className="mt-3 text-center md:mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    asChild
                    className="rounded-full font-bold text-xs md:h-11 md:px-6 md:text-sm"
                  >
                    <Link to={routes.catalog} className="flex items-center gap-2">
                      <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
            className="mx-auto max-w-md pb-8 text-center md:max-w-2xl md:pb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="mb-3 text-sm text-primary-foreground/80 md:mx-auto md:mb-5 md:max-w-xl md:text-lg md:leading-relaxed">
              {texts.home.heroEarnPointsDesc}
            </p>
            <Button
              size="sm"
              variant="secondary"
              asChild
              className="rounded-full font-bold text-xs md:h-11 md:px-6 md:text-sm"
            >
              <Link to={routes.catalog} className="flex items-center gap-2">
                <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {texts.home.orderNow}
                <AnimatedCtaArrows />
              </Link>
            </Button>
          </motion.div>
        )}

        {/* ─── Guest: simple CTA (tier teaser moved to Welcome) ─── */}
        {!isAuthenticated && (
          <div className="pb-10 text-center md:pb-16">
            <div className="mx-auto mb-4 w-full max-w-md md:mb-8 md:max-w-3xl">
              <BonusBanner visibility="all" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="rounded-xl font-bold md:h-14 md:rounded-2xl md:px-10 md:text-base"
              >
                <Link to={routes.catalog} className="flex items-center gap-2">
                  {texts.home.orderNow}
                  <AnimatedCtaArrows size="md" className="ml-1 md:scale-110" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild className="rounded-xl font-bold md:h-14 md:px-8">
                <Link
                  to={routes.login}
                  className="text-sm font-semibold text-primary-foreground underline-offset-4 hover:underline md:text-base"
                >
                  {texts.home.heroGuestFomoCta}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
