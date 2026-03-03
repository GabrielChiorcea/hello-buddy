/**
 * Streak campaigns section — casino/rewards style that blends with the warm app theme.
 * Uses a subtle warm-dark gradient instead of pure gray-900.
 * Plugin: plugins/streak
 */

import React from 'react';
import { useQuery } from '@apollo/client';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { CampaignCard } from './CampaignCard';
import { ACTIVE_STREAK_CAMPAIGNS, MY_STREAK_ENROLLMENT } from '../queries';
import type { StreakCampaign, StreakEnrollment } from '../types';
import { Flame, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <section className="relative py-10 overflow-hidden">
      {/* Warm-dark gradient that blends with the app's warm palette */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/90 via-orange-950/80 to-amber-950/90" />
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.08)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(234,88,12,0.06)_0%,_transparent_50%)]" />
      {/* Top edge warm glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      {/* Bottom soft blend — matches --background */}
      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-background to-transparent" />
      {/* Top soft blend */}
      <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-background to-transparent" />

      <div className="relative container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Campanii Active
              <Sparkles className="h-4 w-4 text-amber-400/60 streak-sparkle" />
            </h2>
            <p className="text-xs text-amber-400/50">Completează streak-ul și câștigă puncte bonus</p>
          </div>
        </motion.div>

        {/* Cards scroll */}
        <div className="overflow-x-auto overflow-y-hidden -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
          <div className="flex gap-5 pb-2 min-w-0 scroll-smooth" style={{ scrollbarGutter: 'stable' }}>
            {campaigns.map((campaign, index) => {
              const enrollment =
                myActiveEnrollment?.campaignId === campaign.id ? myActiveEnrollment : null;
              const enrolledInOtherCampaign =
                myActiveEnrollment != null && myActiveEnrollment.campaignId !== campaign.id;
              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex-shrink-0 w-[min(100%,320px)] md:w-80"
                >
                  <CampaignCard
                    campaign={campaign}
                    enrollment={enrollment ?? undefined}
                    enrolledInOtherCampaign={enrolledInOtherCampaign}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
