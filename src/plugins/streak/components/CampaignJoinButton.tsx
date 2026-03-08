/**
 * Casino-style join button with glow and shine effects
 * Plugin: plugins/streak
 * All colors use semantic reward-* tokens.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useAppSelector } from '@/store';
import { routes } from '@/config/routes';
import { JOIN_STREAK_CAMPAIGN } from '../mutations';
import { ACTIVE_STREAK_CAMPAIGNS, MY_STREAK_ENROLLMENT } from '../queries';
import type { StreakCampaign } from '../types';
import { Loader2, Sparkles, Trophy, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CampaignJoinButtonProps {
  campaign: StreakCampaign;
  enrollment: { completedAt: string | null } | null | undefined;
  enrolledInOtherCampaign?: boolean;
  onJoined?: () => void;
  className?: string;
}

export const CampaignJoinButton: React.FC<CampaignJoinButtonProps> = ({
  campaign,
  enrollment,
  enrolledInOtherCampaign,
  onJoined,
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const [joinCampaign, { loading }] = useMutation(JOIN_STREAK_CAMPAIGN, {
    refetchQueries: [
      { query: MY_STREAK_ENROLLMENT, variables: { campaignId: campaign.id } },
      { query: MY_STREAK_ENROLLMENT },
      { query: ACTIVE_STREAK_CAMPAIGNS },
    ],
  });

  const completed = enrollment?.completedAt != null;

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate(routes.login, { state: { from: location }, replace: false });
      return;
    }
    try {
      await joinCampaign({ variables: { campaignId: campaign.id } });
      onJoined?.();
    } catch (e) {
      console.error('Join campaign error', e);
    }
  };

  const baseClasses = cn(
    'relative w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide uppercase transition-all duration-300 overflow-hidden',
    className
  );

  if (enrollment && !completed) {
    return (
      <div className={cn(baseClasses, 'bg-gradient-to-r from-reward-accent/40 to-reward-accent/30 text-reward border border-reward/30 cursor-default flex items-center justify-center gap-2')}>
        <Sparkles className="h-4 w-4 streak-sparkle" />
        Înscris — Continuă seria!
        <Sparkles className="h-4 w-4 streak-sparkle" style={{ animationDelay: '0.5s' }} />
      </div>
    );
  }

  if (completed) {
    return (
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className={cn(baseClasses, 'bg-gradient-to-r from-reward via-reward-light to-reward text-reward-foreground flex items-center justify-center gap-2 shadow-lg shadow-reward/30')}
      >
        <Trophy className="h-4 w-4" />
        Streak Complet — Premiu câștigat!
      </motion.div>
    );
  }

  if (enrolledInOtherCampaign) {
    return (
      <div className={cn(baseClasses, 'bg-reward-surface-foreground/5 text-reward-surface-foreground/30 border border-reward-surface-foreground/10 cursor-not-allowed flex items-center justify-center gap-2')}>
        <Lock className="h-4 w-4" />
        Înscris la altă campanie
      </div>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        baseClasses,
        'bg-gradient-to-r from-reward via-reward-light to-reward text-reward-foreground',
        'hover:from-reward-light hover:via-reward hover:to-reward-light',
        'shadow-lg shadow-reward/30 hover:shadow-xl hover:shadow-reward/40',
        'streak-glow flex items-center justify-center gap-2',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {/* Shine sweep overlay */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-reward-surface-foreground/30 to-transparent animate-streak-shine" />
      </div>
      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Se înscrie...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Participă acum
          </>
        )}
      </span>
    </motion.button>
  );
};
