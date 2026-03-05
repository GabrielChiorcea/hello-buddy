/**
 * Casino / Rewards style campaign card — dark theme with gold accents,
 * shimmer effects, sparkle particles, maximum visual impact.
 * Plugin: plugins/streak
 */

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useQuery } from '@apollo/client';
import { ACTIVE_STREAK_CAMPAIGN, MY_STREAK_ENROLLMENT } from '../queries';
import { StreakProgressBar } from './StreakProgressBar';
import { CampaignJoinButton } from './CampaignJoinButton';
import type { StreakCampaign, StreakEnrollment } from '../types';
import { Flame, Gift, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

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

  if (campaignProp === undefined && (campaignLoading || !campaign)) return null;
  if (!campaign) return null;

  const completed = enrollment?.completedAt != null;
  const confettiFired = useRef(false);

  useEffect(() => {
    if (completed && !confettiFired.current) {
      confettiFired.current = true;
      // Gold-themed confetti burst
      const gold = ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#ffffff'];
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: gold,
        scalar: 1.2,
      });
      // Second burst for dramatic effect
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { y: 0.5, x: 0.4 },
          colors: gold,
          scalar: 0.9,
        });
      }, 300);
    }
  }, [completed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="streak-card-enter"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-amber-500/20 h-full flex flex-col shadow-2xl shadow-amber-900/20">
        {/* Ambient glow behind card */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating sparkles */}
        <div className="absolute top-4 right-6 pointer-events-none">
          <Sparkles className="h-4 w-4 text-amber-400/40 streak-sparkle" />
        </div>
        <div className="absolute top-12 right-12 pointer-events-none">
          <Sparkles className="h-3 w-3 text-yellow-400/30 streak-sparkle" style={{ animationDelay: '0.7s' }} />
        </div>
        <div className="absolute bottom-20 left-6 pointer-events-none">
          <Sparkles className="h-3 w-3 text-amber-400/25 streak-sparkle" style={{ animationDelay: '1.2s' }} />
        </div>

        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 ${!completed ? 'streak-glow' : ''}`}>
                <Flame className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">{campaign.name}</h3>
              {campaign.customText && (
                <p className="text-xs text-amber-400/60 mt-0.5 line-clamp-2">{campaign.customText}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bonus points badge */}
        <div className="px-5 pb-3">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/20 rounded-full px-3.5 py-1.5">
            <Gift className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-sm font-bold streak-shimmer">{campaign.bonusPoints} puncte</span>
            <span className="text-xs text-amber-400/50">premiu</span>
          </div>
        </div>

        {/* Progress section */}
        <div className="px-5 pb-4 flex-1 flex flex-col">
          {enrollmentProp === undefined && enrollmentLoading && !enrollment ? (
            <Skeleton className="h-12 w-full bg-white/5" />
          ) : enrollment ? (
            <StreakProgressBar
              current={enrollment.currentStreakCount}
              required={enrollment.campaign?.ordersRequired ?? campaign.ordersRequired}
              completed={completed}
              streakType={campaign.streakType}
            />
          ) : null}
        </div>

        {/* Divider with glow */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        {/* CTA */}
        <div className="p-5 pt-4 mt-auto">
          <CampaignJoinButton
            campaign={campaign}
            enrollment={enrollment ?? undefined}
            enrolledInOtherCampaign={enrolledInOtherCampaign}
          />
        </div>
      </div>
    </motion.div>
  );
};
