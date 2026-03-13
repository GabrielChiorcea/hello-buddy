/**
 * Gamified style — Casino / Rewards look
 * Dark backgrounds, glow effects, shimmer text, sparkles
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
    <div className="relative overflow-hidden rounded-2xl bg-reward-surface border border-reward/20 h-full flex flex-col shadow-2xl shadow-reward-accent/20">
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-reward/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-reward-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating sparkles */}
      <div className="absolute top-4 right-6 pointer-events-none">
        <Sparkles className="h-4 w-4 text-reward/40 streak-sparkle" />
      </div>
      <div className="absolute top-12 right-12 pointer-events-none">
        <Sparkles className="h-3 w-3 text-reward-light/30 streak-sparkle" style={{ animationDelay: '0.7s' }} />
      </div>

      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-reward to-reward-accent flex items-center justify-center shadow-lg shadow-reward/30 ${!completed ? 'streak-glow' : ''}`}>
              <Flame className="h-5 w-5 text-reward-surface-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-reward-surface-foreground truncate">{campaign.name}</h3>
            <p className="text-xs text-reward/60 mt-0.5">
              {campaign.recurrenceType === 'consecutive' ? 'Zile consecutive' : campaign.recurrenceType === 'rolling' ? `Fereastră mobilă (${campaign.rollingWindowDays} zile)` : campaign.recurrenceType}
            </p>
          </div>
        </div>
      </div>

      {/* Rule description */}
      <div className="px-5 pb-2">
        <p className="text-sm text-reward-surface-foreground/70 leading-relaxed">
          {campaign.customText || buildRuleDescription(campaign)}
        </p>
      </div>

      {/* Period info */}
      <div className="px-5 pb-2 flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-reward/50 flex-shrink-0" />
        <span className="text-xs text-reward/50">
          {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
        </span>
        {remaining > 0 && remaining <= 14 && (
          <span className="text-[10px] bg-reward/15 text-reward rounded-full px-2 py-0.5 font-medium">
            {remaining} {remaining === 1 ? 'zi' : 'zile'} rămase
          </span>
        )}
      </div>

      {/* Reward badges */}
      <div className="px-5 pb-2 flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-reward/15 to-reward-light/10 border border-reward/20 rounded-full px-3.5 py-1.5">
          <Gift className="h-3.5 w-3.5 text-reward" />
          <span className="text-sm font-bold streak-shimmer">{campaign.bonusPoints} puncte</span>
          <span className="text-xs text-reward/50">
            {campaign.rewardType === 'single' ? 'la completare' : 'bonus final'}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-reward-surface-foreground/5 border border-reward-surface-foreground/10 rounded-full px-2.5 py-1">
          <Target className="h-3 w-3 text-reward/60" />
          <span className="text-xs text-reward/60">{campaign.ordersRequired} comenzi necesare</span>
        </div>
        {campaign.resetType === 'soft_decay' && (
          <div className="inline-flex items-center gap-1.5 bg-status-confirmed/10 border border-status-confirmed/20 rounded-full px-2.5 py-1">
            <Shield className="h-3 w-3 text-status-confirmed" />
            <span className="text-xs text-status-confirmed">Soft Decay</span>
          </div>
        )}
      </div>

      {/* Steps ladder */}
      {hasSteps && (
        <div className="px-5 pb-3">
          <div className="bg-reward-surface-foreground/5 rounded-xl p-3 border border-reward-surface-foreground/5">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-reward/70" />
              <span className="text-xs font-semibold text-reward/70 uppercase tracking-wider">Praguri recompensă</span>
            </div>
            <RewardStepsLadder
              steps={campaign.rewardSteps}
              currentCount={isEnrolled ? enrollment!.currentStreakCount : null}
              styleName="gamified"
              bonusPoints={campaign.bonusPoints}
              completed={completed}
            />
          </div>
        </div>
      )}

      {/* Multiplier info */}
      {campaign.rewardType === 'multiplier' && (
        <div className="px-5 pb-3">
          <div className="bg-reward-surface-foreground/5 rounded-xl p-3 border border-reward-surface-foreground/5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-reward/70" />
              <span className="text-xs font-semibold text-reward/70 uppercase tracking-wider">Multiplicator</span>
            </div>
            <p className="text-xs text-reward-surface-foreground/50">
              Baza {campaign.baseMultiplier}× · +{campaign.multiplierIncrement}× per pas · Aplicat la {campaign.bonusPoints} puncte
            </p>
          </div>
        </div>
      )}

      {/* Validation */}
      {hasValidation && (
        <div className="px-5 pb-2 flex flex-wrap gap-2">
          <span className="text-[10px] text-reward/40 bg-reward-surface-foreground/5 rounded px-2 py-0.5">
            Min. {campaign.minOrderValue} RON/comandă
          </span>
        </div>
      )}

      {/* Progress */}
      {isEnrolled && (
        <div className="px-5 pb-4 flex-1 flex flex-col">
          {enrollmentLoading && !enrollment ? (
            <Skeleton className="h-12 w-full bg-reward-surface-foreground/5" />
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

      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-reward/30 to-transparent" />

      <div className="p-5 pt-4 mt-auto">
        <CampaignJoinButton campaign={campaign} enrollment={enrollment ?? undefined} enrolledInOtherCampaign={enrolledInOtherCampaign} />
      </div>
    </div>
  );
};
