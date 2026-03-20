/**
 * Clean / Minimal style — simple, discreet, no dark backgrounds
 * Uses card/primary tokens instead of reward tokens
 */
import React from 'react';
import { Flame, Gift, Calendar, Target, Shield, XCircle } from 'lucide-react';
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

export const CleanCard: React.FC<Props> = ({
  campaign, enrollment, enrolledInOtherCampaign, completed, isEnrolled, enrollmentLoading,
}) => {
  const remaining = daysRemaining(campaign.endDate);
  const hasSteps = campaign.rewardType === 'steps' && campaign.rewardSteps?.length > 0;

  const streakBroken = isConsecutiveStreakBroken(enrollment, campaign);
  const impossible = isImpossibleToComplete(enrollment, campaign);
  const isFailed = streakBroken || impossible;

  return (
    <div className={`rounded-xl bg-card border border-border h-full flex flex-col ${isFailed ? 'opacity-80' : ''}`}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${isFailed ? 'bg-destructive/10' : 'bg-primary/10'} flex items-center justify-center`}>
            {isFailed ? <XCircle className="h-4.5 w-4.5 text-destructive" /> : <Flame className="h-4.5 w-4.5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">{campaign.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {campaign.recurrenceType === 'consecutive' ? 'Zile consecutive' : campaign.recurrenceType === 'rolling' ? `Fereastră mobilă` : campaign.recurrenceType}
            </p>
          </div>
        </div>
      </div>

      {/* Failed state */}
      {isFailed && (
        <div className="px-4 pb-3">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
            <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-destructive">
                {streakBroken ? 'Streak-ul consecutiv s-a întrerupt' : `Nu mai sunt suficiente zile pentru completare`}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Poți părăsi campania și te poți înscrie la alta.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {!isFailed && (
        <div className="px-4 pb-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {campaign.customText || buildRuleDescription(campaign)}
          </p>
        </div>
      )}

      {/* Period */}
      <div className="px-4 pb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}</span>
        {!isFailed && remaining > 0 && remaining <= 14 && (
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
            {remaining} {remaining === 1 ? 'zi' : 'zile'}
          </span>
        )}
      </div>

      {/* Info row */}
      {!isFailed && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-md px-2.5 py-1 text-xs font-medium">
            <Gift className="h-3 w-3" />
            {campaign.bonusPoints} puncte
          </span>
          <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground rounded-md px-2.5 py-1 text-xs">
            <Target className="h-3 w-3" />
            {campaign.ordersRequired} comenzi
          </span>
          {campaign.resetType === 'soft_decay' && (
            <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground rounded-md px-2.5 py-1 text-xs">
              <Shield className="h-3 w-3" />
              Soft Decay
            </span>
          )}
        </div>
      )}

      {/* Steps */}
      {hasSteps && !isFailed && (
        <div className="px-4 pb-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Praguri recompensă</p>
            <RewardStepsLadder
              steps={campaign.rewardSteps}
              currentCount={isEnrolled ? enrollment!.currentStreakCount : null}
              styleName="clean"
              bonusPoints={campaign.bonusPoints}
              completed={completed}
            />
          </div>
        </div>
      )}

      {/* Progress */}
      {isEnrolled && !isFailed && (
        <div className="px-4 pb-4 flex-1 flex flex-col">
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

      <div className="mx-4 h-px bg-border" />

      <div className="p-4 pt-3 mt-auto">
        <CampaignJoinButton campaign={campaign} enrollment={enrollment ?? undefined} enrolledInOtherCampaign={enrolledInOtherCampaign} isFailed={isFailed} />
      </div>
    </div>
  );
};
