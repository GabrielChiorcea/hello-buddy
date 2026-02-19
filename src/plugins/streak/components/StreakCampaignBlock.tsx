/**
 * Wrapper that shows CampaignCard only when streak plugin is enabled and there is an active campaign
 * Plugin: plugins/streak
 */

import React from 'react';
import { useQuery } from '@apollo/client';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { CampaignCard } from './CampaignCard';
import { ACTIVE_STREAK_CAMPAIGN } from '../queries';
import type { StreakCampaign } from '../types';

export const StreakCampaignBlock: React.FC = () => {
  const { enabled, loading } = usePluginEnabled('streak');
  const { data } = useQuery<{ activeStreakCampaign: StreakCampaign | null }>(ACTIVE_STREAK_CAMPAIGN, {
    fetchPolicy: 'cache-first',
    skip: !enabled,
  });
  const campaign = data?.activeStreakCampaign ?? null;
  if (loading || !enabled || !campaign) return null;
  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <CampaignCard campaign={campaign} />
      </div>
    </section>
  );
};
