/**
 * Friendly / Casual style — Warm and approachable
 * Rounded shapes, soft shadows, warm accent colors, playful but not over-the-top
 */
import React from 'react';
import { Flame, Gift, Calendar, Target, XCircle } from 'lucide-react';
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
  isFailed: boolean;
  failReason: 'broken' | 'impossible' | null;
  enrollmentLoading?: boolean;
}

export const FriendlyCard: React.FC<Props> = ({
  campaign, enrollment, enrolledInOtherCampaign, completed, isEnrolled, enrollmentLoading,
}) => {
  const remaining = daysRemaining(campaign.endDate);
  const hasSteps = campaign.rewardType === 'steps' && campaign.rewardSteps?.length > 0;

  const streakBroken = isConsecutiveStreakBroken(enrollment, campaign);
  const impossible = isImpossibleToComplete(enrollment, campaign);
  const isFailed = streakBroken || impossible;

  return (
    <div className={`rounded-2xl bg-accent/30 border-2 ${isFailed ? 'border-destructive/30' : 'border-accent'} h-full flex flex-col shadow-md`}>
      {/* Header with warm background */}
      <div className={`p-4 pb-3 rounded-t-2xl ${isFailed ? 'bg-destructive/5' : 'bg-gradient-to-b from-accent/50 to-transparent'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${isFailed ? 'bg-destructive/20' : 'bg-primary'} flex items-center justify-center shadow-sm`}>
            {isFailed ? <XCircle className="h-5 w-5 text-destructive" /> : <Flame className="h-5 w-5 text-primary-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">{campaign.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {campaign.recurrenceType === 'consecutive' ? 'Zile consecutive' : campaign.recurrenceType === 'rolling' ? 'Fereastră mobilă' : campaign.recurrenceType}
            </p>
          </div>
        </div>
      </div>

      {/* Failed state */}
      {isFailed && (
        <div className="px-4 pb-3">
          <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5">
            <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">
                {streakBroken ? 'Streak-ul s-a întrerupt 😞' : 'Nu mai sunt suficiente zile 😔'}
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
          <p className="text-sm text-foreground/80 leading-relaxed">
            {campaign.customText || buildRuleDescription(campaign)}
          </p>
        </div>
      )}

      {/* Period */}
      <div className="px-4 pb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}</span>
        {!isFailed && remaining > 0 && remaining <= 14 && (
          <span className="bg-warning/20 text-warning-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
            ⏰ {remaining} {remaining === 1 ? 'zi' : 'zile'}
          </span>
        )}
      </div>

      {/* Fun badges */}
      {!isFailed && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary rounded-full px-3 py-1.5 text-xs font-semibold">
            <Gift className="h-3.5 w-3.5" />
            {campaign.bonusPoints} puncte
          </span>
          <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground rounded-full px-3 py-1.5 text-xs">
            <Target className="h-3 w-3" />
            {campaign.ordersRequired} comenzi
          </span>
        </div>
      )}

      {/* Steps */}
      {hasSteps && !isFailed && (
        <div className="px-4 pb-3">
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-xs font-semibold text-foreground/80 mb-2">
              Praguri recompensă
            </p>
            <RewardStepsLadder
              steps={campaign.rewardSteps}
              currentCount={isEnrolled ? enrollment!.currentStreakCount : null}
              styleName="friendly"
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
