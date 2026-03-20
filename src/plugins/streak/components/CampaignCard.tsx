/**
 * Campaign Card — delegates to style-specific variant
 * Plugin: plugins/streak
 */

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useQuery } from '@apollo/client';
import { ACTIVE_STREAK_CAMPAIGN, MY_STREAK_ENROLLMENT } from '../queries';
import type { StreakCampaign, StreakEnrollment } from '../types';
import { motion } from 'framer-motion';
import { useComponentStyle } from '@/config/componentStyle';
import { isConsecutiveStreakBroken, isImpossibleToComplete } from './campaignUtils';
import { GamifiedCard } from './styles/gamifiedCard';
import { CleanCard } from './styles/cleanCard';
import { PremiumCard } from './styles/premiumCard';
import { FriendlyCard } from './styles/friendlyCard';

export interface CampaignCardProps {
  campaign?: StreakCampaign | null;
  enrollment?: StreakEnrollment | null;
  enrolledInOtherCampaign?: boolean;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign: campaignProp,
  enrollment: enrollmentProp,
  enrolledInOtherCampaign,
}) => {
  const componentStyle = useComponentStyle();

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
      pollInterval: campaignId ? 15_000 : 0, // refetch la 15s ca bara de progres să se actualizeze după livrare
    }
  );
  const enrollment =
    enrollmentProp !== undefined ? enrollmentProp : campaign ? enrollmentData?.myStreakEnrollment ?? null : null;

  const completed = enrollment?.completedAt != null;
  const isEnrolled = enrollment != null;
  const confettiFired = useRef(false);
  const lastCelebratedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!completed || componentStyle !== 'gamified' || !campaignId) return;

    const completionKey = `streak-confetti-${campaignId}-${enrollment?.completedAt ?? 'unknown'}`;

    if (lastCelebratedKey.current === completionKey) return;
    if (typeof window !== 'undefined') {
      if (window.localStorage.getItem(completionKey)) {
        lastCelebratedKey.current = completionKey;
        return;
      }
      lastCelebratedKey.current = completionKey;
      window.localStorage.setItem(completionKey, '1');
    }

    if (!confettiFired.current) {
      confettiFired.current = true;
      const gold = ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#ffffff'];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: gold, scalar: 1.2 });
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 100, origin: { y: 0.5, x: 0.4 }, colors: gold, scalar: 0.9 });
      }, 300);
    }
  }, [completed, componentStyle, campaignId, enrollment?.completedAt]);

  if (campaignProp === undefined && (campaignLoading || !campaign)) return null;
  if (!campaign) return null;

  const sharedProps = {
    campaign,
    enrollment,
    enrolledInOtherCampaign,
    completed,
    isEnrolled,
    enrollmentLoading: enrollmentProp === undefined ? enrollmentLoading : false,
  };

  const StyleCard = {
    gamified: GamifiedCard,
    clean: CleanCard,
    premium: PremiumCard,
    friendly: FriendlyCard,
  }[componentStyle];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <StyleCard {...sharedProps} />
    </motion.div>
  );
};
