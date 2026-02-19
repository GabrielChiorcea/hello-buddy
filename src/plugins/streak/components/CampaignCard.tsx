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

export const CampaignCard: React.FC = () => {
  const { data: campaignData, loading: campaignLoading } = useQuery<{ activeStreakCampaign: StreakCampaign | null }>(
    ACTIVE_STREAK_CAMPAIGN,
    { fetchPolicy: 'cache-and-network' }
  );
  const campaignId = campaignData?.activeStreakCampaign?.id;
  const { data: enrollmentData, loading: enrollmentLoading } = useQuery<{ myStreakEnrollment: StreakEnrollment | null }>(
    MY_STREAK_ENROLLMENT,
    { variables: { campaignId: campaignId ?? undefined }, fetchPolicy: 'cache-and-network', skip: !campaignId }
  );

  const campaign = campaignData?.activeStreakCampaign ?? null;
  const enrollment = campaign ? enrollmentData?.myStreakEnrollment ?? null : null;

  if (campaignLoading || !campaign) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{campaign.name}</h2>
        </div>
        {campaign.customText && (
          <p className="text-sm text-muted-foreground">{campaign.customText}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {enrollmentLoading && !enrollment ? (
          <Skeleton className="h-8 w-full" />
        ) : enrollment ? (
          <StreakProgressBar
            current={enrollment.currentStreakCount}
            required={enrollment.campaign?.ordersRequired ?? campaign.ordersRequired}
            completed={enrollment.completedAt != null}
          />
        ) : null}
        <CampaignJoinButton
          campaign={campaign}
          enrollment={enrollment ?? undefined}
        />
      </CardContent>
    </Card>
  );
};
