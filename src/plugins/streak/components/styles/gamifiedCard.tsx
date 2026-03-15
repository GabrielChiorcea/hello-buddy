/**
 * Gamified style — Casino / Rewards look
 * Dark navy/purple gradient, orange accents, Rajdhani typography, step nodes.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Gift, Sparkles, Shield, Calendar, Target, TrendingUp } from 'lucide-react';
import type { StreakCampaign, StreakEnrollment } from '../../types';
import { StreakProgressBar } from '../StreakProgressBar';
import { CampaignJoinButton } from '../CampaignJoinButton';
import { Skeleton } from '@/components/ui/skeleton';
import { buildRuleDescription, formatDate, daysRemaining } from '../campaignUtils';
import { RewardStepsLadder } from '../RewardStepsLadder';

interface Props {
  campaign: StreakCampaign;
  enrollment: StreakEnrollment | null;
  enrolledInOtherCampaign?: boolean;
  completed: boolean;
  isEnrolled: boolean;
  enrollmentLoading?: boolean;
}

export const GamifiedCard: React.FC<Props> = ({
  campaign, enrollment, enrolledInOtherCampaign, completed, isEnrolled, enrollmentLoading,
}) => {
  const remaining = daysRemaining(campaign.endDate);
  const hasSteps = campaign.rewardType === 'steps' && campaign.rewardSteps?.length > 0;
  const hasValidation = campaign.minOrderValue > 0;

  return (
    <div className="gamified-casino-card relative overflow-hidden rounded-2xl h-full flex flex-col">
      {/* Diagonal line texture is applied via .gamified-casino-card::before in CSS */}

      {/* Ambient glow — culori din temă */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-reward/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-reward-light/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating sparkles — keep existing SVG */}
      <div className="absolute top-4 right-6 pointer-events-none z-10">
        <Sparkles className="h-4 w-4 text-reward/50 streak-sparkle" />
      </div>
      <div className="absolute top-12 right-12 pointer-events-none z-10">
        <Sparkles className="h-3 w-3 text-reward-light/30 streak-sparkle" style={{ animationDelay: '0.7s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-reward to-reward-light flex items-center justify-center shadow-lg shadow-reward/40 ${!completed ? 'streak-glow' : ''}`}>
              <Flame className="h-5 w-5 text-reward-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="gamified-casino-title truncate">{campaign.name}</h3>
            <p className="gamified-casino-body text-xs mt-0.5 opacity-90">
              {campaign.recurrenceType === 'consecutive' ? 'Zile consecutive' : campaign.recurrenceType === 'rolling' ? `Fereastră mobilă (${campaign.rollingWindowDays} zile)` : campaign.recurrenceType}
            </p>
          </div>
        </div>
      </div>

      {/* Rule description */}
      <div className="relative z-10 px-5 pb-2">
        <p className="gamified-casino-body leading-relaxed">
          {campaign.customText || buildRuleDescription(campaign)}
        </p>
      </div>

      {/* Period info */}
      <div className="relative z-10 px-5 pb-2 flex items-center gap-2 flex-wrap">
        <span className="gamified-casino-body text-xs flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-reward/90 flex-shrink-0" />
          {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
        </span>
        {remaining > 0 && remaining <= 14 && (
          <span className="gamified-casino-badge-label bg-reward/30 text-reward-surface-foreground rounded-full px-2.5 py-0.5">
            {remaining} {remaining === 1 ? 'zi' : 'zile'} rămase
          </span>
        )}
      </div>

      {/* Reward badges — semantic colors */}
      <div className="relative z-10 px-5 pb-2 flex flex-wrap gap-2">
        <div className="gamified-badge-points inline-flex items-center gap-2 rounded-full px-3.5 py-1.5">
          <Gift className="h-3.5 w-3.5 text-reward-foreground flex-shrink-0" />
          <span className="gamified-casino-badge-label text-reward-foreground">{campaign.bonusPoints} puncte</span>
          <span className="gamified-casino-badge-label text-reward-foreground/90 text-[11px]">
            {campaign.rewardType === 'single' ? 'la completare' : 'bonus final'}
          </span>
        </div>
        <div className="gamified-badge-orders inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
          <Target className="h-3 w-3 text-reward flex-shrink-0" />
          <span className="gamified-casino-badge-label text-reward-surface-foreground">{campaign.ordersRequired} comenzi necesare</span>
        </div>
        {campaign.resetType === 'soft_decay' && (
          <div className="gamified-badge-softdecay inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
            <Shield className="h-3 w-3 text-status-confirmed flex-shrink-0" />
            <span className="gamified-casino-badge-label text-reward-surface-foreground">Soft Decay</span>
          </div>
        )}
      </div>

      {/* Steps ladder — only when not enrolled */}
      {hasSteps && !isEnrolled && (
        <div className="relative z-10 px-5 pb-3">
          <div className="rounded-xl p-3 bg-reward-surface-foreground/[0.04] border border-reward-surface-foreground/10">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-reward-surface-foreground/90" />
              <span className="gamified-casino-badge-label text-reward-surface-foreground uppercase tracking-wider">Praguri recompensă</span>
            </div>
            <RewardStepsLadder
              steps={campaign.rewardSteps}
              currentCount={null}
              styleName="gamified"
              bonusPoints={campaign.bonusPoints}
              completed={false}
            />
          </div>
        </div>
      )}

      {/* Multiplier info */}
      {campaign.rewardType === 'multiplier' && (
        <div className="relative z-10 px-5 pb-3">
          <div className="rounded-xl p-3 bg-reward-surface-foreground/[0.04] border border-reward-surface-foreground/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-reward-surface-foreground/90" />
              <span className="gamified-casino-badge-label text-reward-surface-foreground uppercase tracking-wider">Multiplicator</span>
            </div>
            <p className="gamified-casino-body text-xs">
              Baza {campaign.baseMultiplier}× · +{campaign.multiplierIncrement}× per pas · Aplicat la {campaign.bonusPoints} puncte
            </p>
          </div>
        </div>
      )}

      {/* Min. order — subtle dark pill */}
      {hasValidation && (
        <div className="relative z-10 px-5 pb-2 flex flex-wrap gap-2">
          <span className="gamified-badge-min gamified-casino-badge-label text-reward-surface-foreground rounded-full px-3 py-1">
            Min. {campaign.minOrderValue} RON/comandă
          </span>
        </div>
      )}

      {/* Progress — step nodes when enrolled */}
      {isEnrolled && (
        <div className="relative z-10 px-5 pb-4 flex-1 flex flex-col">
          {enrollmentLoading && !enrollment ? (
            <Skeleton className="h-12 w-full bg-reward-surface-foreground/10 rounded-lg" />
          ) : (
            <StreakProgressBar
              current={enrollment!.currentStreakCount}
              required={enrollment!.campaign?.ordersRequired ?? campaign.ordersRequired}
              completed={completed}
              recurrenceType={campaign.recurrenceType}
              rewardSteps={campaign.rewardSteps}
            />
          )}
        </div>
      )}

      <div className="relative z-10 mx-5 h-px bg-gradient-to-r from-transparent via-reward/30 to-transparent" />

      <div className="relative z-10 p-5 pt-4 mt-auto">
        <CampaignJoinButton campaign={campaign} enrollment={enrollment ?? undefined} enrolledInOtherCampaign={enrolledInOtherCampaign} />
      </div>
    </div>
  );
};
