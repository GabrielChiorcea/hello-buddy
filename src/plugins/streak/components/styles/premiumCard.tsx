/**
 * Premium style — Elegant and refined
 * Subtle gradients, muted tones, refined typography, no flashy animations
 */
import React from 'react';
import { Flame, Gift, Calendar, Target, XCircle, Clock } from 'lucide-react';
import type { StreakCampaign, StreakEnrollment } from '../../types';
import { StreakProgressBar } from '../StreakProgressBar';
import { CampaignJoinButton } from '../CampaignJoinButton';
import { Skeleton } from '@/components/ui/skeleton';
import { buildRuleDescription, formatDate, daysRemaining } from '../campaignUtils';
import { RewardStepsLadder } from '../RewardStepsLadder';
import { getImageUrl } from '@/lib/imageUrl';
import { CampaignCompactPreview } from '../CampaignCompactPreview';
import type { PointsReward } from '@/plugins/points/types';

interface Props {
  campaign: StreakCampaign;
  enrollment: StreakEnrollment | null;
  enrolledInOtherCampaign?: boolean;
  completed: boolean;
  isEnrolled: boolean;
  isFailed: boolean;
  failReason: 'broken' | 'impossible' | null;
  enrollmentLoading?: boolean;
  variant?: 'compact' | 'full';
  onOpenDetail?: () => void;
  pointsRewards?: PointsReward[];
  pointsPerOrder?: number;
}

function calculateMaxDiscountFromPoints(totalPoints: number, pointsRewards: PointsReward[], maxRedemptions: number): number {
  const rewards = pointsRewards.filter((reward) => reward.isActive && reward.pointsCost > 0 && reward.discountAmount > 0);
  if (rewards.length === 0 || totalPoints <= 0 || maxRedemptions <= 0) return 0;
  const cap = Math.floor(totalPoints);
  const usesCap = Math.floor(maxRedemptions);
  const dp = Array.from({ length: usesCap + 1 }, () => new Array<number>(cap + 1).fill(0));
  for (let use = 1; use <= usesCap; use++) {
    for (let p = 0; p <= cap; p++) {
      dp[use][p] = dp[use - 1][p];
      for (const reward of rewards) {
        if (reward.pointsCost <= p) dp[use][p] = Math.max(dp[use][p], dp[use - 1][p - reward.pointsCost] + reward.discountAmount);
      }
    }
  }
  return dp[usesCap][cap];
}

export const PremiumCard: React.FC<Props> = ({
  campaign, enrollment, enrolledInOtherCampaign, completed, isEnrolled, isFailed, failReason, enrollmentLoading, variant = 'full', onOpenDetail, pointsRewards = [], pointsPerOrder = 0,
}) => {
  const currentCount = enrollment?.currentStreakCount ?? 0;
  const required = enrollment?.campaign?.ordersRequired ?? campaign.ordersRequired;
  const potentialPoints = campaign.rewardType === 'steps'
    ? campaign.bonusPoints + campaign.rewardSteps.reduce((sum, step) => sum + step.pointsAwarded, 0)
    : campaign.bonusPoints;
  const remainingOrders = Math.max(0, required - currentCount);
  const displayPoints = potentialPoints + remainingOrders * pointsPerOrder;
  const estimatedSavingsRon = calculateMaxDiscountFromPoints(displayPoints, pointsRewards, remainingOrders);

  if (variant === 'compact') {
    return (
      <CampaignCompactPreview
        title={campaign.name}
        subtitle={campaign.recurrenceType === 'consecutive' ? 'Zile consecutive' : `Fereastră mobilă (${campaign.rollingWindowDays} zile)`}
        imageUrl={campaign.imageUrl ? getImageUrl(campaign.imageUrl) : null}
        dateRange={`${formatDate(campaign.startDate)} — ${formatDate(campaign.endDate)}`}
        points={potentialPoints}
        progress={Math.min(100, Math.max(0, (currentCount / Math.max(1, required)) * 100))}
        totalOrders={required}
        completedOrders={currentCount}
        estimatedSavingsRon={estimatedSavingsRon > 0 ? estimatedSavingsRon : null}
        isEnrolled={isEnrolled}
        isFailed={isFailed}
        onOpenDetail={onOpenDetail}
      />
    );
  }

  const remaining = daysRemaining(campaign.endDate);
  const hasSteps = campaign.rewardType === 'steps' && campaign.rewardSteps?.length > 0;

  return (
    <div className={`rounded-2xl bg-card h-full flex flex-col shadow-lg shadow-foreground/5 border border-border/50 overflow-hidden ${isFailed ? 'opacity-80' : ''}`}>
      {/* Elegant top accent line */}
      <div className={`h-1 bg-gradient-to-r ${isFailed ? 'from-destructive/40 via-destructive/60 to-destructive/40' : 'from-primary/60 via-primary to-primary/60'}`} />

      {campaign.imageUrl && (
        <div className="px-5 pt-5 pb-1">
          <div className="h-32 rounded-xl overflow-hidden border border-border/60 bg-muted/40">
            <img src={getImageUrl(campaign.imageUrl)} alt={campaign.name} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${isFailed ? 'bg-destructive/5 border-destructive/20' : 'bg-gradient-to-b from-primary/15 to-primary/5 border-primary/20'}`}>
            {isFailed ? <XCircle className="h-4.5 w-4.5 text-destructive" /> : <Flame className="h-4.5 w-4.5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground tracking-tight truncate">{campaign.name}</h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5 tracking-wide uppercase">
              {campaign.recurrenceType === 'consecutive' ? 'Serie consecutivă' : campaign.recurrenceType === 'rolling' ? 'Fereastră mobilă' : campaign.recurrenceType}
            </p>
          </div>
        </div>
      </div>

      {/* Failed state */}
      {isFailed && (
        <div className="px-5 pb-3">
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3">
            <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-destructive">
                {failReason === 'broken' ? 'Streak-ul consecutiv s-a întrerupt' : 'Nu mai sunt suficiente zile pentru completare'}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Poți părăsi campania și te poți înscrie la alta.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {!isFailed && (
        <div className="px-5 pb-3">
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            {campaign.customText || buildRuleDescription(campaign)}
          </p>
        </div>
      )}

      {/* Period */}
      <div className="px-5 pb-2 flex items-center gap-2 text-xs text-muted-foreground/60">
        <Calendar className="h-3 w-3 flex-shrink-0" />
        <span className="tracking-wide">{formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}</span>
        {!isFailed && remaining > 0 && remaining <= 14 && (
          <span className="text-primary/70 font-medium inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {remaining} {remaining === 1 ? 'zi' : 'zile'}
          </span>
        )}
      </div>

      {/* Refined info */}
      {!isFailed && (
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
      )}

      {/* Steps */}
      {hasSteps && !isFailed && (
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
      {isEnrolled && !isFailed && (
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
        <CampaignJoinButton campaign={campaign} enrollment={enrollment ?? undefined} enrolledInOtherCampaign={enrolledInOtherCampaign} isFailed={isFailed} />
      </div>
    </div>
  );
};
