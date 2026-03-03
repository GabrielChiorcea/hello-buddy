/**
 * Campaign card - shows active streak campaign, progress, join button
 * Plugin: plugins/streak
 */

import React from 'react';
import { useQuery } from '@apollo/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ACTIVE_STREAK_CAMPAIGN, MY_STREAK_ENROLLMENT } from '../queries';
import { StreakProgressBar } from './StreakProgressBar';
import { CampaignJoinButton } from './CampaignJoinButton';
import type { StreakCampaign, StreakEnrollment } from '../types';
import { Flame } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface CampaignCardProps {
  /** When provided, skip ACTIVE_STREAK_CAMPAIGN and use this campaign (avoids duplicate query when used inside StreakCampaignBlock). */
  campaign?: StreakCampaign | null;
  /** When provided (e.g. from StreakCampaignBlock list), skip enrollment query and use this. */
  enrollment?: StreakEnrollment | null;
  /** When true, user is enrolled in another campaign; join button is disabled. */
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

  if (campaignProp === undefined && (campaignLoading || !campaign)) {
    return null;
  }
  if (!campaign) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-background h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{campaign.name}</h2>
        </div>
        {campaign.customText && (
          <p className="text-sm text-muted-foreground">{campaign.customText}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {enrollmentProp === undefined && enrollmentLoading && !enrollment ? (
          <Skeleton className="h-8 w-full" />
        ) : enrollment ? (
          <StreakProgressBar
            current={enrollment.currentStreakCount}
            required={enrollment.campaign?.ordersRequired ?? campaign.ordersRequired}
            completed={enrollment.completedAt != null}
            streakType={campaign.streakType}
          />
        ) : null}
        <CampaignJoinButton
          campaign={campaign}
          enrollment={enrollment ?? undefined}
          enrolledInOtherCampaign={enrolledInOtherCampaign}
        />
      </CardContent>
    </Card>
  );
};
