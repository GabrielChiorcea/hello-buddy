/**
 * Streak campaigns section — marketing-optimized gamified version.
 * Urgency countdown, push CTAs, aggressive titles.
 */

import React from 'react';
import { useQuery } from '@apollo/client';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { useAppSelector } from '@/store';
import { CampaignCard } from './CampaignCard';
import { ACTIVE_STREAK_CAMPAIGNS, MY_STREAK_ENROLLMENT } from '../queries';
import type { StreakCampaign, StreakEnrollment } from '../types';
import { Flame, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useComponentStyle } from '@/config/componentStyle';
import { shouldHideImpossibleCampaign } from './campaignUtils';

export const StreakCampaignBlock: React.FC = () => {
  const { enabled, loading } = usePluginEnabled('streak');
  const style = useComponentStyle();
  const { isAuthenticated } = useAppSelector((s) => s.user);
  const { data: campaignsData } = useQuery<{ activeStreakCampaigns: StreakCampaign[] }>(ACTIVE_STREAK_CAMPAIGNS, {
    fetchPolicy: 'cache-and-network',
    skip: !enabled,
  });
  const { data: enrollmentData } = useQuery<{ myStreakEnrollment: StreakEnrollment | null }>(MY_STREAK_ENROLLMENT, {
    fetchPolicy: 'cache-and-network',
    skip: !enabled,
  });
  const campaigns = campaignsData?.activeStreakCampaigns ?? [];
  const myActiveEnrollment = enrollmentData?.myStreakEnrollment ?? null;
  const visibleCampaigns = campaigns.filter((campaign) => {
    const enrollmentForCampaign = myActiveEnrollment?.campaignId === campaign.id ? myActiveEnrollment : null;
    return !shouldHideImpossibleCampaign(enrollmentForCampaign, campaign);
  });

  if (loading || !enabled) return null;

  const isGamified = style === 'gamified';

  // Check if user is authenticated but not enrolled in any campaign
  const isNotEnrolled = isAuthenticated && !myActiveEnrollment && visibleCampaigns.length > 0;
  const topBonusPoints = visibleCampaigns.reduce((max, c) => Math.max(max, c.bonusPoints), 0);

  return (
    <section className="relative py-10 overflow-hidden bg-background">
      <div className="relative container mx-auto px-4">
        {/* Section header — aggressive marketing title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className={isGamified
            ? "w-9 h-9 rounded-lg bg-gradient-to-br from-reward to-reward-accent flex items-center justify-center shadow-lg shadow-reward/20"
            : "w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"
          }>
            <Flame className={isGamified ? "h-6 w-20 text-reward-surface-foreground" : "h-6 w-20 text-primary"} />
          </div>
          <div>
            {isGamified && isNotEnrolled ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-reward/30 bg-reward/10 px-4 py-2.5">
                <Zap className="h-5 w-5 text-reward flex-shrink-0" />
                <p className="text-xs font-medium text-foreground leading-none">
                  Poți câștiga până la{' '}
                  <span className="font-bold text-reward">{topBonusPoints} puncte</span> — înscrie-te acum și începe să acumulezi!
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {isGamified ? (
                    <>
                      Câștigă puncte BONUS
                      <Sparkles className="h-4 w-4 text-reward/60 streak-sparkle" />
                    </>
                  ) : (
                    'Campanii Active'
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isGamified
                    ? 'Completează streak-ul și deblochează recompense exclusive'
                    : 'Completează streak-ul și câștigă puncte bonus'}
                </p>
              </>
            )}
          </div>
        </motion.div>

        <div className="overflow-x-auto overflow-y-hidden -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 bg-background scrollbar-none">
          <div className="flex gap-5 pb-2 min-w-0 scroll-smooth after:content-[''] after:flex-shrink-0 after:w-4 sm:after:w-6 md:after:w-0">
            {visibleCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Momentan nu există campanii active.</p>
            ) : visibleCampaigns.map((campaign, index) => {
              const enrolledInOtherCampaign = myActiveEnrollment != null && myActiveEnrollment.campaignId !== campaign.id;
              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex-shrink-0 w-[min(100%,320px)] md:w-80"
                >
                  <CampaignCard campaign={campaign} enrolledInOtherCampaign={enrolledInOtherCampaign} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
