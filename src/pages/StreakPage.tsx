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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const StreakPage: React.FC = () => {
  const { enabled, loading: flagLoading } = usePluginEnabled('streak');
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

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
  const selectedCampaign = visibleCampaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;
  const selectedEnrollment =
    selectedCampaign && myActiveEnrollment?.campaignId === selectedCampaign.id ? myActiveEnrollment : null;
  const selectedEnrolledInOtherCampaign =
    selectedCampaign != null &&
    myActiveEnrollment != null &&
    myActiveEnrollment.campaignId !== selectedCampaign.id;
  const detailOpen = selectedCampaign != null;
  const closeDetail = () => setSelectedCampaignId(null);

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
                      variant="compact"
                      onOpenDetail={() => setSelectedCampaignId(campaign.id)}
                    />
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {selectedCampaign && (
        <>
          {isMobile ? (
            <Sheet open={detailOpen} onOpenChange={(open) => !open && closeDetail()}>
              <SheetContent
                side="bottom"
                className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-0 [&>button]:z-50 [&>button]:opacity-100 [&>button]:rounded-full [&>button]:bg-background/90 [&>button]:p-2 [&>button]:text-foreground [&>button]:shadow-md"
              >
                <CampaignCard
                  campaign={selectedCampaign}
                  enrollment={selectedEnrollment}
                  enrolledInOtherCampaign={selectedEnrolledInOtherCampaign}
                  variant="full"
                />
              </SheetContent>
            </Sheet>
          ) : (
            <Dialog open={detailOpen} onOpenChange={(open) => !open && closeDetail()}>
              <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-4 [&>button]:z-50 [&>button]:opacity-100 [&>button]:rounded-full [&>button]:bg-background/90 [&>button]:p-2 [&>button]:text-foreground [&>button]:shadow-md">
                <CampaignCard
                  campaign={selectedCampaign}
                  enrollment={selectedEnrollment}
                  enrolledInOtherCampaign={selectedEnrolledInOtherCampaign}
                  variant="full"
                />
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </Layout>
  );
};

export default StreakPage;
