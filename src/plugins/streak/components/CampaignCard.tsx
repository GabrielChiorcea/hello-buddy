/**
 * Casino / Rewards style campaign card V2
 * Shows full campaign details before and after enrollment
 * Plugin: plugins/streak
 */

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useQuery } from '@apollo/client';
import { ACTIVE_STREAK_CAMPAIGN, MY_STREAK_ENROLLMENT } from '../queries';
import { StreakProgressBar } from './StreakProgressBar';
import { CampaignJoinButton } from './CampaignJoinButton';
import type { StreakCampaign, StreakEnrollment, RewardStep } from '../types';
import { Flame, Gift, Sparkles, Shield, Calendar, Target, TrendingUp, Star, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const RECURRENCE_LABELS: Record<string, string> = {
  consecutive: 'Zile consecutive',
  rolling: 'Fereastră mobilă',
};

function buildRuleDescription(campaign: StreakCampaign): string {
  const { recurrenceType, ordersRequired, rollingWindowDays } = campaign;
  if (recurrenceType === 'consecutive') {
    return `Comandă ${ordersRequired} zile la rând pentru a completa streak-ul.`;
  }
  if (recurrenceType === 'calendar_weekly') {
    return `Plasează ${ordersRequired} comenzi într-o săptămână (Luni–Duminică).`;
  }
  if (recurrenceType === 'rolling') {
    return `Plasează ${ordersRequired} comenzi în orice fereastră de ${rollingWindowDays} zile.`;
  }
  return `Completează ${ordersRequired} comenzi.`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysRemaining(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function buildRewardDescription(campaign: StreakCampaign): string {
  if (campaign.rewardType === 'single') {
    return `Primești ${campaign.bonusPoints} puncte la completare.`;
  }
  if (campaign.rewardType === 'multiplier') {
    return `Puncte × multiplicator (baza ${campaign.baseMultiplier}x, +${campaign.multiplierIncrement}x/pas).`;
  }
  // steps
  return `Câștigi puncte la fiecare prag + ${campaign.bonusPoints} bonus la final.`;
}

export interface CampaignCardProps {
  campaign?: StreakCampaign | null;
  enrollment?: StreakEnrollment | null;
  enrolledInOtherCampaign?: boolean;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign: campaignProp,
  enrollment: enrollmentProp,
  enrolledInOtherCampaign,
}) => {
  const { data: campaignData, loading: campaignLoading } = useQuery<{ activeStreakCampaign: StreakCampaign | null }>(
    ACTIVE_STREAK_CAMPAIGN,
    { fetchPolicy: 'cache-and-network', skip: campaignProp !== undefined }
  );
  const campaign = campaignProp ?? campaignData?.activeStreakCampaign ?? null;
  const campaignId = campaign?.id;
  const { data: enrollmentData, loading: enrollmentLoading } = useQuery<{ myStreakEnrollment: StreakEnrollment | null }>(
    MY_STREAK_ENROLLMENT,
    {
      variables: { campaignId: campaignId ?? undefined },
      fetchPolicy: 'cache-and-network',
      skip: !campaignId || enrollmentProp !== undefined,
    }
  );
  const enrollment =
    enrollmentProp !== undefined ? enrollmentProp : campaign ? enrollmentData?.myStreakEnrollment ?? null : null;

  const completed = enrollment?.completedAt != null;
  const isEnrolled = enrollment != null;
  const confettiFired = useRef(false);

  useEffect(() => {
    if (completed && !confettiFired.current) {
      confettiFired.current = true;
      const gold = ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#ffffff'];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: gold, scalar: 1.2 });
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 100, origin: { y: 0.5, x: 0.4 }, colors: gold, scalar: 0.9 });
      }, 300);
    }
  }, [completed]);

  if (campaignProp === undefined && (campaignLoading || !campaign)) return null;
  if (!campaign) return null;

  const hasValidation = campaign.minOrderValue > 0;
  const remaining = daysRemaining(campaign.endDate);
  const hasSteps = campaign.rewardType === 'steps' && campaign.rewardSteps && campaign.rewardSteps.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="streak-card-enter"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-amber-500/20 h-full flex flex-col shadow-2xl shadow-amber-900/20">
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating sparkles */}
        <div className="absolute top-4 right-6 pointer-events-none">
          <Sparkles className="h-4 w-4 text-amber-400/40 streak-sparkle" />
        </div>
        <div className="absolute top-12 right-12 pointer-events-none">
          <Sparkles className="h-3 w-3 text-yellow-400/30 streak-sparkle" style={{ animationDelay: '0.7s' }} />
        </div>

        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 ${!completed ? 'streak-glow' : ''}`}>
                <Flame className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">{campaign.name}</h3>
              <p className="text-xs text-amber-400/60 mt-0.5">
                {RECURRENCE_LABELS[campaign.recurrenceType] || campaign.recurrenceType}
                {campaign.recurrenceType === 'rolling' && ` (${campaign.rollingWindowDays} zile)`}
              </p>
            </div>
          </div>
        </div>

        {/* Rule description — always visible */}
        <div className="px-5 pb-2">
          <p className="text-sm text-amber-100/70 leading-relaxed">
            {campaign.customText || buildRuleDescription(campaign)}
          </p>
        </div>

        {/* Period info */}
        <div className="px-5 pb-2 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-amber-400/50 flex-shrink-0" />
          <span className="text-xs text-amber-400/50">
            {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
          </span>
          {remaining > 0 && remaining <= 14 && (
            <span className="text-[10px] bg-amber-500/15 text-amber-400 rounded-full px-2 py-0.5 font-medium">
              {remaining} {remaining === 1 ? 'zi' : 'zile'} rămase
            </span>
          )}
        </div>

        {/* Reward info badges */}
        <div className="px-5 pb-2 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/20 rounded-full px-3.5 py-1.5">
            <Gift className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-sm font-bold streak-shimmer">{campaign.bonusPoints} puncte</span>
            <span className="text-xs text-amber-400/50">
              {campaign.rewardType === 'single' ? 'la completare' : 'bonus final'}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
            <Target className="h-3 w-3 text-amber-400/60" />
            <span className="text-xs text-amber-400/60">{campaign.ordersRequired} comenzi necesare</span>
          </div>
          {campaign.resetType === 'soft_decay' && (
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-1">
              <Shield className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-blue-400">Soft Decay</span>
            </div>
          )}
        </div>

        {/* Reward steps ladder — visible for 'steps' type */}
        {hasSteps && (
          <div className="px-5 pb-3">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-amber-400/70" />
                <span className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider">Praguri recompensă</span>
              </div>
              <div className="space-y-1.5">
                {campaign.rewardSteps
                  .slice()
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map((step) => {
                    const reached = isEnrolled && enrollment.currentStreakCount >= step.stepNumber;
                    return (
                      <div
                        key={step.stepNumber}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                          reached
                            ? 'bg-amber-500/15 border border-amber-500/25'
                            : 'bg-white/[0.03] border border-transparent'
                        }`}
                      >
                        <span className={`flex items-center gap-2 ${reached ? 'text-amber-300' : 'text-white/50'}`}>
                          <Star className={`h-3 w-3 ${reached ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
                          {step.label || `Pasul ${step.stepNumber}`}
                        </span>
                        <span className={`font-bold ${reached ? 'text-amber-400' : 'text-white/40'}`}>
                          +{step.pointsAwarded} pt
                        </span>
                      </div>
                    );
                  })}
                {/* Final bonus row */}
                {campaign.bonusPoints > 0 && (
                  <div
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                      completed
                        ? 'bg-amber-500/20 border border-amber-500/30'
                        : 'bg-white/[0.03] border border-dashed border-amber-500/15'
                    }`}
                  >
                    <span className={`flex items-center gap-2 ${completed ? 'text-amber-300' : 'text-white/40'}`}>
                      <Award className={`h-3 w-3 ${completed ? 'text-amber-400 fill-amber-400' : 'text-white/15'}`} />
                      Bonus completare
                    </span>
                    <span className={`font-bold ${completed ? 'text-amber-400' : 'text-white/30'}`}>
                      +{campaign.bonusPoints} pt
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Multiplier info */}
        {campaign.rewardType === 'multiplier' && (
          <div className="px-5 pb-3">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-amber-400/70" />
                <span className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider">Multiplicator</span>
              </div>
              <p className="text-xs text-white/50">
                Baza {campaign.baseMultiplier}× · +{campaign.multiplierIncrement}× per pas · Aplicat la {campaign.bonusPoints} puncte
              </p>
            </div>
          </div>
        )}

        {/* Validation info / conditions */}
        {hasValidation && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {campaign.minOrderValue > 0 && (
              <span className="text-[10px] text-amber-400/40 bg-white/5 rounded px-2 py-0.5">
                Min. {campaign.minOrderValue} RON/comandă
              </span>
            )}
          </div>
        )}

        {/* Progress section — only when enrolled */}
        {isEnrolled && (
          <div className="px-5 pb-4 flex-1 flex flex-col">
            {enrollmentProp === undefined && enrollmentLoading && !enrollment ? (
              <Skeleton className="h-12 w-full bg-white/5" />
            ) : (
              <StreakProgressBar
                current={enrollment.currentStreakCount}
                required={enrollment.campaign?.ordersRequired ?? campaign.ordersRequired}
                completed={completed}
                recurrenceType={campaign.recurrenceType}
                rewardSteps={campaign.rewardSteps}
              />
            )}
          </div>
        )}

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        {/* CTA */}
        <div className="p-5 pt-4 mt-auto">
          <CampaignJoinButton
            campaign={campaign}
            enrollment={enrollment ?? undefined}
            enrolledInOtherCampaign={enrolledInOtherCampaign}
          />
        </div>
      </div>
    </motion.div>
  );
};
