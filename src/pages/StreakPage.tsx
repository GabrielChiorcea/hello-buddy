/**
 * StreakPage — Pagina dedicată campaniilor streak
 * Afișare verticală + rank utilizator
 */

import React from 'react';
import { useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { TierProgressBar } from '@/components/layout/TierProgressBar';
import { CampaignCard } from '@/plugins/streak/components/CampaignCard';
import { ACTIVE_STREAK_CAMPAIGNS, MY_STREAK_ENROLLMENT } from '@/plugins/streak/queries';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { PageLoader } from '@/components/common/Loader';
import { texts } from '@/config/texts';
import { shouldHideImpossibleCampaign } from '@/plugins/streak/components/campaignUtils';
import type { StreakCampaign, StreakEnrollment } from '@/plugins/streak/types';

const StreakPage: React.FC = () => {
  const { enabled, loading: flagLoading } = usePluginEnabled('streak');

  const { data: campaignsData, loading: campaignsLoading } = useQuery<{
    activeStreakCampaigns: StreakCampaign[];
  }>(ACTIVE_STREAK_CAMPAIGNS, {
    fetchPolicy: 'cache-and-network',
    skip: !enabled,
  });

  const { data: enrollmentData } = useQuery<{
    myStreakEnrollment: StreakEnrollment | null;
  }>(MY_STREAK_ENROLLMENT, {
    fetchPolicy: 'cache-and-network',
    skip: !enabled,
  });

  const campaigns = campaignsData?.activeStreakCampaigns ?? [];
  const myActiveEnrollment = enrollmentData?.myStreakEnrollment ?? null;

  const visibleCampaigns = campaigns.filter((campaign) => {
    const enrollmentForCampaign =
      myActiveEnrollment?.campaignId === campaign.id ? myActiveEnrollment : null;
    return !shouldHideImpossibleCampaign(enrollmentForCampaign, campaign);
  });

  if (flagLoading || campaignsLoading) {
    return (
      <Layout>
        <PageLoader />
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="py-10 md:py-14 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4 text-sm font-bold text-primary">
              <Flame className="h-4 w-4" />
              <Sparkles className="h-3 w-3" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
              {texts.streak.pageTitle}
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {texts.streak.pageSubtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Rank / Tier */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <TierProgressBar />
          </div>
        </div>
      </section>

      {/* Campaigns — vertical scroll */}
      <section className="py-8 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto space-y-5">
            {visibleCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {texts.streak.noCampaigns}
              </p>
            ) : (
              visibleCampaigns.map((campaign, index) => {
                const enrolledInOtherCampaign =
                  myActiveEnrollment != null &&
                  myActiveEnrollment.campaignId !== campaign.id;
                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <CampaignCard
                      campaign={campaign}
                      enrolledInOtherCampaign={enrolledInOtherCampaign}
                    />
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default StreakPage;
