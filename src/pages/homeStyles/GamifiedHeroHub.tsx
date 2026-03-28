/**
 * GamifiedHeroHub — Combined hero + tier progress + education section.
 * Authenticated: logo, greeting, points summary, accordion (Rank, Benefits).
 * Guest: logo, title, tier preview grid, FOMO + CTA.
 * When tiers disabled: logo + points education only.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Star, Gift, TrendingUp, ChevronRight, Sparkles, ArrowRight, ShoppingBag } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { TierIcon } from '@/config/tierIcons';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import { useTierDisplayData } from '@/components/layout/tierStyles/shared';
import { GET_LOYALTY_TIERS } from '@/graphql/queries';
import { FreeProductsTierGrid } from '@/components/layout/tierStyles/FreeProductsTierGrid';
import { HomeHeroLogo } from './HomeHeroLogo';

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface LoyaltyTierLite {
  id: string;
  name: string;
  xpThreshold: number;
  pointsMultiplier: number;
  badgeIcon?: string | null;
  sortOrder: number;
  benefitDescription?: string | null;
}

/* ── Gradient progress bar (reused from gamifiedTier) ── */
const GradientBar: React.FC<{ percent: number }> = ({ percent }) => (
  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-primary-foreground/15">
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

  const { data: tiersListData } = useQuery<{ loyaltyTiers: LoyaltyTierLite[] }>(GET_LOYALTY_TIERS, {
    fetchPolicy: 'cache-first',
    skip: isAuthenticated, // only need list for guests
  });

  const tiers: LoyaltyTierLite[] = (tiersListData?.loyaltyTiers ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? a.xpThreshold) - (b.sortOrder ?? b.xpThreshold));

  const pointsBalance = user?.pointsBalance ?? 0;
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 overflow-hidden text-primary-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className="container mx-auto px-4 relative">
        {/* ─── Top: Logo + greeting ─── */}
        <div className="pt-12 md:pt-16 pb-4 text-center">
          <HomeHeroLogo variant="gamified" />

          {isAuthenticated && user ? (
            <>
              <motion.h1
                className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: easeOut }}
              >
                {texts.home.heroWelcomeBack.replace('{name}', firstName)}
              </motion.h1>

              {/* Points pill */}
              {pointsEnabled && (
                <motion.div
                  className="inline-flex items-center gap-2 bg-primary-foreground/15 rounded-full px-4 py-1.5 text-sm font-bold"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <Star className="h-4 w-4 fill-current" />
                  {pointsBalance > 0
                    ? `${texts.home.heroPointsLabel.replace('{count}', String(pointsBalance))} ${texts.home.heroPointsAvailable}`
                    : texts.home.heroEarnPoints}
                </motion.div>
              )}
            </>
          ) : (
            <motion.h1
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
            >
              {texts.home.heroTitle}
            </motion.h1>
          )}
        </div>

        {/* ─── Authenticated: Tier accordion ─── */}
        {isAuthenticated && tiersEnabled && tierData && (
          <motion.div
            className="max-w-xl mx-auto pb-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Compact rank bar (always visible) */}
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl border border-primary-foreground/15 p-4 mb-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
                  <span className="text-xl leading-none">{tierData.currentBadgeIcon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">{tierData.tierName}</span>
                    <span className="text-[10px] font-bold bg-primary-foreground/20 rounded-full px-2 py-0.5">
                      x{tierData.multiplier.toFixed(1)}
                    </span>
                    {tierData.isMaxLevel && (
                      <span className="text-[10px] font-bold bg-primary-foreground/25 rounded-full px-2 py-0.5 flex items-center gap-0.5">
                        <Sparkles className="h-2.5 w-2.5" /> MAX
                      </span>
                    )}
                  </div>
                  {!tierData.isMaxLevel && tierData.nextTierThreshold && (
                    <p className="text-xs text-primary-foreground/70 mt-0.5">
                      {texts.home.heroXpProgress
                        .replace('{current}', String(tierData.currentXp))
                        .replace('{target}', String(tierData.nextTierThreshold))}
                      {tierData.xpToNextLevel != null && (
                        <span className="ml-1.5 text-primary-foreground/50">
                          · {texts.home.heroXpRemaining.replace('{count}', String(tierData.xpToNextLevel))}
                        </span>
                      )}
                    </p>
                  )}
                  {tierData.isMaxLevel && (
                    <p className="text-xs text-primary-foreground/80 font-medium">{texts.home.heroMaxLevel}</p>
                  )}
                </div>
              </div>
              <GradientBar percent={tierData.progressPercent} />
            </div>

            {/* Accordion sections */}
            <Accordion type="single" collapsible className="space-y-1">
              {/* Benefits */}
              <AccordionItem value="benefits" className="border-0">
                <AccordionTrigger className="bg-primary-foreground/8 hover:bg-primary-foreground/12 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:no-underline [&>svg]:text-primary-foreground/60">
                  <span className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    {texts.home.heroBenefits}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 text-primary-foreground/80">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Zap className="h-3 w-3 flex-shrink-0" />
                      <span>{tierData.currentBenefit}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <TrendingUp className="h-3 w-3 flex-shrink-0" />
                      <span>{tierData.xpFormulaText}</span>
                    </div>
                    {tierData.hasFreeProductBenefits ? (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-primary-foreground flex items-center gap-1">
                          <Gift className="h-3 w-3" /> {texts.home.heroFreeProductsActive}
                        </p>
                        <FreeProductsTierGrid summaries={tierData.freeProductCampaignsSummary} />
                      </div>
                    ) : (
                      <p className="text-[11px] text-primary-foreground/60">{texts.home.heroNoFreeProducts}</p>
                    )}
                    {/* Next tier preview */}
                    {!tierData.isMaxLevel && tierData.nextTier && (
                      <div className="flex items-center gap-2 pt-1 border-t border-primary-foreground/10 mt-2 text-xs">
                        <ChevronRight className="h-3 w-3 flex-shrink-0" />
                        <span className="text-primary-foreground/60">{texts.home.heroUnlocks}</span>
                        <TierIcon badgeIcon={tierData.nextTier.badgeIcon} tierLabel={tierData.nextTier.name} size={14} className="inline" />
                        <span className="font-semibold">{tierData.nextTier.name}</span>
                        <span className="ml-auto text-[10px] font-bold">x{tierData.nextMultiplier.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* How it works */}
              <AccordionItem value="how" className="border-0">
                <AccordionTrigger className="bg-primary-foreground/8 hover:bg-primary-foreground/12 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:no-underline [&>svg]:text-primary-foreground/60">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {texts.home.heroHowItWorks}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 text-primary-foreground/80">
                  <div className="space-y-2 text-xs">
                    <p>🛒 {texts.home.heroHowPointsWork}</p>
                    <p>📈 {texts.home.heroHowRanksWork}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Micro CTA */}
            {!tierData.isMaxLevel && (
              <div className="mt-3 text-center">
                <Button size="sm" variant="secondary" asChild className="rounded-full font-bold text-xs">
                  <Link to={routes.catalog} className="flex items-center gap-2">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    {texts.home.heroOrderForXp}
                    <ArrowRight className="h-3.5 w-3.5" />
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
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </motion.div>
        )}

        {/* ─── Guest: Full tier preview ─── */}
        {!isAuthenticated && tiersEnabled && (
          <motion.div
            className="max-w-xl mx-auto pb-10"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* FOMO banner */}
            <div className="flex items-center gap-2 rounded-xl bg-primary-foreground/10 border border-primary-foreground/15 px-3 py-2 mb-4">
              <Sparkles className="h-4 w-4 flex-shrink-0" />
              <p className="text-[11px] font-medium">
                {texts.home.heroGuestFomo}{' '}
                <span className="font-bold">{texts.home.heroGuestFomoReward}</span>
              </p>
            </div>

            {/* Tiers grid */}
            {tiers.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="relative rounded-xl border border-primary-foreground/15 bg-primary-foreground/8 p-2.5 flex flex-col items-center text-center gap-0.5"
                  >
                    <div className="relative inline-flex">
                      <TierIcon badgeIcon={tier.badgeIcon} tierLabel={tier.name} size={28} />
                      <span className="absolute -top-3 -right-10 bg-primary-foreground text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        x{tier.pointsMultiplier.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold mt-1">{tier.name}</p>
                    <p className="text-[9px] text-primary-foreground/60">{tier.xpThreshold} XP</p>
                  </div>
                ))}
              </div>
            )}

            {/* Education: how it works */}
            <div className="space-y-1.5 mb-4 text-xs text-primary-foreground/80">
              <p>🛒 {texts.home.heroHowPointsWork}</p>
              <p>📈 {texts.home.heroHowRanksWork}</p>
            </div>

            {/* CTA */}
            <Button asChild size="sm" className="w-full rounded-xl font-bold bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to={routes.login} className="flex items-center justify-center gap-2">
                <Zap className="h-3.5 w-3.5" />
                {texts.home.heroSignUpCta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </motion.div>
        )}

        {/* ─── Guest, no tiers: simple CTA ─── */}
        {!isAuthenticated && !tiersEnabled && (
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
                <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
