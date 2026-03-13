/**
 * Premium style — Elegant and refined
 * Subtle gradients, muted tones, refined typography, no flashy animations
 */
import React from 'react';
import { Flame, Gift, Calendar, Target } from 'lucide-react';
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

export const PremiumCard: React.FC<Props> = ({
  campaign, enrollment, enrolledInOtherCampaign, completed, isEnrolled, enrollmentLoading,
}) => {
  const remaining = daysRemaining(campaign.endDate);
  const hasSteps = campaign.rewardType === 'steps' && campaign.rewardSteps?.length > 0;

  return (
    <div className="rounded-2xl bg-card h-full flex flex-col shadow-lg shadow-foreground/5 border border-border/50 overflow-hidden">
      {/* Elegant top accent line */}
      <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-b from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center">
            <Flame className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground tracking-tight truncate">{campaign.name}</h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5 tracking-wide uppercase">
              {campaign.recurrenceType === 'consecutive' ? 'Serie consecutivă' : campaign.recurrenceType === 'rolling' ? 'Fereastră mobilă' : campaign.recurrenceType}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 pb-3">
        <p className="text-sm text-muted-foreground leading-relaxed italic">
          {campaign.customText || buildRuleDescription(campaign)}
        </p>
      </div>

      {/* Period */}
      <div className="px-5 pb-2 flex items-center gap-2 text-xs text-muted-foreground/60">
        <Calendar className="h-3 w-3 flex-shrink-0" />
        <span className="tracking-wide">{formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}</span>
        {remaining > 0 && remaining <= 14 && (
          <span className="text-primary/70 font-medium">{remaining} {remaining === 1 ? 'zi' : 'zile'}</span>
        )}
      </div>

      {/* Refined info */}
      <div className="px-5 pb-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 text-primary text-xs font-medium">
          <Gift className="h-3 w-3" />
          {campaign.bonusPoints} puncte {campaign.rewardType === 'single' ? 'la completare' : 'bonus'}
        </span>
        <span className="text-muted-foreground/30">·</span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground/60 text-xs">
          <Target className="h-3 w-3" />
          {campaign.ordersRequired} comenzi
        </span>
      </div>

      {/* Steps */}
      {hasSteps && (
        <div className="px-5 pb-3">
          <RewardStepsLadder
            steps={campaign.rewardSteps}
            currentCount={isEnrolled ? enrollment!.currentStreakCount : null}
            styleName="premium"
            bonusPoints={campaign.bonusPoints}
            completed={completed}
          />
        </div>
      )}

      {/* Progress */}
      {isEnrolled && (
        <div className="px-5 pb-4 flex-1 flex flex-col">
          {enrollmentLoading && !enrollment ? (
            <Skeleton className="h-10 w-full" />
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

      <div className="mx-5 h-px bg-border/50" />

      <div className="p-5 pt-4 mt-auto">
        <CampaignJoinButton campaign={campaign} enrollment={enrollment ?? undefined} enrolledInOtherCampaign={enrolledInOtherCampaign} />
      </div>
    </div>
  );
};
