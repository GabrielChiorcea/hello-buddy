/**
 * Gamified Tier — marketing-optimized with milestones, loss aversion, micro-CTA
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Zap, Gift, TrendingUp, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';
import { TierIcon } from '@/config/tierIcons';
import { routes } from '@/config/routes';
import type { TierDisplayData } from './shared';
import { FreeProductsTierGrid } from './FreeProductsTierGrid';

const GradientProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
  const isMilestone75 = percent >= 75 && percent < 100;
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(16 90% 60%), hsl(36 100% 55%))' }}
      />
      <div
        className="absolute inset-y-0 w-1/3 rounded-full opacity-30"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', animation: 'shimmer-sweep 2.5s ease-in-out infinite' }}
      />
      {/* Sparkle at milestone 75%+ */}
      {isMilestone75 && (
        <motion.div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `${percent}%` }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Sparkles className="h-3.5 w-3.5 text-reward -translate-x-1/2" />
        </motion.div>
      )}
    </div>
  );
};

const InfoPill: React.FC<{ icon: React.ReactNode; children: React.ReactNode; variant?: 'default' | 'highlight' }> = ({ icon, children, variant = 'default' }) => (
  <div className={cn(
    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px]',
    variant === 'highlight' ? 'bg-primary/10 text-primary' : 'bg-secondary/80 text-muted-foreground',
  )}>
    <span className="flex-shrink-0">{icon}</span>
    <span className="leading-tight">{children}</span>
  </div>
);

export const GamifiedTier: React.FC<{ data: TierDisplayData }> = ({ data }) => {
  const {
    tierName,
    currentBadgeIcon,
    multiplier,
    currentXp,
    progressPercent,
    isMaxLevel,
    xpToNextLevel,
    nextTierThreshold,
    currentBenefit,
    xpFormulaText,
    nextTier,
    nextMultiplier,
    hasFreeProductBenefits,
    freeProductCampaignsSummary,
  } = data;

  const isHalfway = progressPercent >= 50 && progressPercent < 75;
  const isAlmostThere = progressPercent >= 75 && progressPercent < 100;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-border shadow-sm', 'bg-gradient-to-br from-card via-card to-accent/30')}>
      {/* Badge + Info */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="relative flex-shrink-0">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', 'bg-gradient-to-br from-primary/20 to-accent/40', 'ring-2 ring-primary/20')}>
            <span className="text-2xl leading-none text-primary">{currentBadgeIcon}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-5 items-center rounded-full bg-primary px-1.5 shadow-sm">
            <Zap className="h-2.5 w-2.5 text-primary-foreground" />
            <span className="text-[9px] font-bold text-primary-foreground">x{multiplier.toFixed(1)}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-foreground truncate">{tierName}</span>
            {isMaxLevel && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                <Sparkles className="h-2.5 w-2.5" /> MAX
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isMaxLevel ? (
              <span className="text-primary font-medium">Nivel maxim atins!</span>
            ) : (
              <><span className="font-semibold text-foreground tabular-nums">{currentXp}</span><span className="text-muted-foreground/60"> / {nextTierThreshold} XP</span></>
            )}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pb-2">
        {!isMaxLevel && xpToNextLevel != null && (
          <p className="mb-1 text-[10px] text-muted-foreground text-right tabular-nums">
            Încă <span className="font-semibold text-foreground">{xpToNextLevel}</span> XP
          </p>
        )}
        <GradientProgressBar percent={progressPercent} />
        {!isMaxLevel && xpToNextLevel != null && (isAlmostThere || isHalfway) && (
          <div className="mt-1">
            {isAlmostThere && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-semibold text-reward flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 streak-sparkle" /> Aproape acolo!
              </motion.p>
            )}
            {isHalfway && !isAlmostThere && (
              <p className="text-sm font-medium text-primary">
                Ești la jumătate! Nu te opri acum
              </p>
            )}
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="px-4 pb-3 space-y-1.5">
        <InfoPill icon={<Gift className="h-3 w-3" />} variant="highlight">
          <span className="font-medium">{currentBenefit}</span>
        </InfoPill>
        <InfoPill icon={<TrendingUp className="h-3 w-3" />}>
          <span className="font-medium">Cum câștigi XP:</span> {xpFormulaText}
        </InfoPill>
        {hasFreeProductBenefits ? (
          <div className="mt-1">
            <p className="text-[10px] text-success">
              {texts.freeProducts.rankInfoActivePrefix}{' '}
              {freeProductCampaignsSummary.length > 0
                ? freeProductCampaignsSummary.map((c) => c.name).join(', ')
                : ''}
            </p>
            <FreeProductsTierGrid summaries={freeProductCampaignsSummary} />
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground mt-1">
            {texts.freeProducts.rankInfoNone}
          </p>
        )}
      </div>

      {/* Next tier — glow card with micro-CTA */}
      {!isMaxLevel && nextTier && (
        <div className={cn('flex flex-col gap-1.5 px-4 py-2.5', 'bg-secondary/60 border-t border-border/50')}>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground">Deblochezi:</span>
            <span className="text-[11px] font-semibold text-foreground">
              <TierIcon
                badgeIcon={nextTier?.badgeIcon}
                tierLabel={nextTier.name}
                size={15}
                className="inline align-middle"
              />{' '}
              {nextTier.name}
            </span>
            <span className="ml-auto text-[10px] font-bold text-primary">x{nextMultiplier.toFixed(1)}</span>
          </div>
          {/* Micro-CTA */}
          <Link
            to={routes.catalog}
            className="mt-1 flex w-full items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <ShoppingBag className="h-4 w-4 flex-shrink-0" />
            Comandă acum pentru XP
            <ArrowRight className="h-4 w-4 flex-shrink-0" />
          </Link>
        </div>
      )}
    </div>
  );
};

// Small ArrowRight inline
const ArrowRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
