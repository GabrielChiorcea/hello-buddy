/**
 * Friendly / Casual style — Warm and approachable
 * Rounded shapes, soft shadows, warm accent colors, playful but not over-the-top
 */
import React from 'react';
import { Flame, Gift, Calendar, Target, Shield, Star, Heart } from 'lucide-react';
import type { StreakCampaign, StreakEnrollment } from '../../types';
import { StreakProgressBar } from '../StreakProgressBar';
import { CampaignJoinButton } from '../CampaignJoinButton';
import { Skeleton } from '@/components/ui/skeleton';
import { buildRuleDescription, formatDate, daysRemaining } from '../campaignUtils';
import { cn } from '@/lib/utils';

interface Props {
  campaign: StreakCampaign;
  enrollment: StreakEnrollment | null;
  enrolledInOtherCampaign?: boolean;
  completed: boolean;
  isEnrolled: boolean;
  enrollmentLoading?: boolean;
}

export const FriendlyCard: React.FC<Props> = ({
  campaign, enrollment, enrolledInOtherCampaign, completed, isEnrolled, enrollmentLoading,
}) => {
  const remaining = daysRemaining(campaign.endDate);
  const hasSteps = campaign.rewardType === 'steps' && campaign.rewardSteps?.length > 0;

  return (
    <div className="rounded-2xl bg-accent/30 border-2 border-accent h-full flex flex-col shadow-md">
      {/* Header with warm background */}
      <div className="p-4 pb-3 bg-gradient-to-b from-accent/50 to-transparent rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">{campaign.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {campaign.recurrenceType === 'consecutive' ? '🔥 Zile consecutive' : campaign.recurrenceType === 'rolling' ? '📅 Fereastră mobilă' : campaign.recurrenceType}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 pb-2">
        <p className="text-sm text-foreground/80 leading-relaxed">
          {campaign.customText || buildRuleDescription(campaign)}
        </p>
      </div>

      {/* Period */}
      <div className="px-4 pb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}</span>
        {remaining > 0 && remaining <= 14 && (
          <span className="bg-warning/20 text-warning-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
            ⏰ {remaining} {remaining === 1 ? 'zi' : 'zile'}
          </span>
        )}
      </div>

      {/* Fun badges */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary rounded-full px-3 py-1.5 text-xs font-semibold">
          <Gift className="h-3.5 w-3.5" />
          🎉 {campaign.bonusPoints} puncte
        </span>
        <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground rounded-full px-3 py-1.5 text-xs">
          <Target className="h-3 w-3" />
          {campaign.ordersRequired} comenzi
        </span>
      </div>

      {/* Steps */}
      {hasSteps && (
        <div className="px-4 pb-3">
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-xs font-semibold text-foreground/80 mb-2 flex items-center gap-1.5">
              <Star className="h-3 w-3 text-primary" />
              Praguri recompensă
            </p>
            <div className="space-y-1.5">
              {campaign.rewardSteps.slice().sort((a, b) => a.stepNumber - b.stepNumber).map((step) => {
                const reached = isEnrolled && enrollment!.currentStreakCount >= step.stepNumber;
                return (
                  <div key={step.stepNumber} className={cn(
                    'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs',
                    reached ? 'bg-success/10 text-success' : 'text-muted-foreground'
                  )}>
                    <span className="flex items-center gap-2">
                      {reached ? '✅' : '⬜'} {step.label || `Pasul ${step.stepNumber}`}
                    </span>
                    <span className="font-bold">+{step.pointsAwarded} pt</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      {isEnrolled && (
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
        <CampaignJoinButton campaign={campaign} enrollment={enrollment ?? undefined} enrolledInOtherCampaign={enrolledInOtherCampaign} />
      </div>
    </div>
  );
};
