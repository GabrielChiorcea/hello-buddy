/**
 * Wrapper that shows campaign cards with title "Campanii" and horizontal scroll.
 * User can be enrolled in only one campaign at a time and chooses which to join.
 * Plugin: plugins/streak
 */

import React from 'react';
import { useQuery } from '@apollo/client';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { CampaignCard } from './CampaignCard';
import { ACTIVE_STREAK_CAMPAIGNS, MY_STREAK_ENROLLMENT } from '../queries';
import type { StreakCampaign, StreakEnrollment } from '../types';

export const StreakCampaignBlock: React.FC = () => {
  const { enabled, loading } = usePluginEnabled('streak');
  const { data: campaignsData } = useQuery<{ activeStreakCampaigns: StreakCampaign[] }>(ACTIVE_STREAK_CAMPAIGNS, {
    fetchPolicy: 'cache-first',
    skip: !enabled,
  });
  const { data: enrollmentData } = useQuery<{ myStreakEnrollment: StreakEnrollment | null }>(MY_STREAK_ENROLLMENT, {
    fetchPolicy: 'cache-and-network',
    skip: !enabled,
  });
  const campaigns = campaignsData?.activeStreakCampaigns ?? [];
  const myActiveEnrollment = enrollmentData?.myStreakEnrollment ?? null;

  if (loading || !enabled || campaigns.length === 0) return null;

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-semibold mb-4">Campanii</h2>
        <div className="overflow-x-auto overflow-y-hidden -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
          <div className="flex gap-4 pb-2 min-w-0 scroll-smooth" style={{ scrollbarGutter: 'stable' }}>
            {campaigns.map((campaign) => {
              const enrollment =
                myActiveEnrollment?.campaignId === campaign.id ? myActiveEnrollment : null;
              const enrolledInOtherCampaign =
                myActiveEnrollment != null && myActiveEnrollment.campaignId !== campaign.id;
              return (
                <div key={campaign.id} className="flex-shrink-0 w-[min(100%,280px)] md:w-72">
                  <CampaignCard
                    campaign={campaign}
                    enrollment={enrollment ?? undefined}
                    enrolledInOtherCampaign={enrolledInOtherCampaign}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
