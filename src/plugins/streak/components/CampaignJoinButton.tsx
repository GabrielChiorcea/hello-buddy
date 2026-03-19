/**
 * Style-aware join button for streak campaigns — marketing-optimized
 * Aggressive CTAs, loss aversion enrolled state, pulse animation.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useAppSelector } from '@/store';
import { routes } from '@/config/routes';
import { JOIN_STREAK_CAMPAIGN } from '../mutations';
import { ACTIVE_STREAK_CAMPAIGNS, MY_STREAK_ENROLLMENT } from '../queries';
import type { StreakCampaign } from '../types';
import { Loader2, Sparkles, Trophy, Lock, ArrowRight, Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useComponentStyle } from '@/config/componentStyle';

export interface CampaignJoinButtonProps {
  campaign: StreakCampaign;
  enrollment: { completedAt: string | null } | null | undefined;
  enrolledInOtherCampaign?: boolean;
  onJoined?: () => void;
  className?: string;
}

export const CampaignJoinButton: React.FC<CampaignJoinButtonProps> = ({
  campaign, enrollment, enrolledInOtherCampaign, onJoined, className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const style = useComponentStyle();
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const [joinCampaign, { loading }] = useMutation(JOIN_STREAK_CAMPAIGN, {
    refetchQueries: [
      { query: MY_STREAK_ENROLLMENT, variables: { campaignId: campaign.id } },
      { query: MY_STREAK_ENROLLMENT },
      { query: ACTIVE_STREAK_CAMPAIGNS },
    ],
  });

  const completed = enrollment?.completedAt != null;
  const isGamified = style === 'gamified';

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
    'relative w-full py-3 px-6 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 overflow-hidden flex items-center justify-center gap-2',
    className
  );

  // Enrolled but not completed — loss aversion
  if (enrollment && !completed) {
    if (isGamified) {
      return (
        <div className={cn(baseClasses, 'bg-gradient-to-r from-reward-accent/40 to-reward-accent/30 text-reward border border-reward/30 cursor-default uppercase')}>
          <Zap className="h-4 w-4" />
          Streak activ! Comandă azi
          <Sparkles className="h-4 w-4 streak-sparkle" style={{ animationDelay: '0.5s' }} />
        </div>
      );
    }
    return (
      <div className={cn(baseClasses, 'bg-primary/10 text-primary border border-primary/20 cursor-default')}>
        <Check className="h-4 w-4" />
        Înscris — Continuă seria!
      </div>
    );
  }

  // Completed
  if (completed) {
    if (isGamified) {
      return (
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
          className={cn(baseClasses, 'bg-gradient-to-r from-reward via-reward-light to-reward text-reward-foreground shadow-lg shadow-reward/30 uppercase')}>
          <Trophy className="h-4 w-4" /> Streak Complet — Premiu câștigat!
        </motion.div>
      );
    }
    return (
      <div className={cn(baseClasses, 'bg-primary text-primary-foreground')}>
        <Trophy className="h-4 w-4" /> Streak complet!
      </div>
    );
  }

  // Enrolled in other campaign
  if (enrolledInOtherCampaign) {
    return (
      <div className={cn(baseClasses, isGamified
        ? 'bg-reward/20 text-foreground border border-reward/30 cursor-not-allowed font-semibold'
        : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
      )}>
        <Lock className="h-4 w-4" /> Înscris la altă campanie
      </div>
    );
  }

  // CTA — Join (aggressive marketing copy + pulse)
  if (isGamified) {
    return (
      <motion.button
        onClick={handleClick}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{ boxShadow: ['0 0 0 0 hsl(var(--reward) / 0)', '0 0 0 6px hsl(var(--reward) / 0.15)', '0 0 0 0 hsl(var(--reward) / 0)'] }}
        transition={{ boxShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
        className={cn(baseClasses, 'gamified-cta-btn disabled:opacity-50 disabled:cursor-not-allowed')}
      >
        <span className="relative z-10 flex items-center gap-2">
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Se înscrie...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Câștigă {campaign.bonusPoints} puncte — Începe acum!</>
          )}
        </span>
      </motion.button>
    );
  }

  // Non-gamified CTA
  return (
    <button onClick={handleClick} disabled={loading}
      className={cn(baseClasses,
        'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
        style === 'friendly' && 'rounded-2xl',
      )}>
      {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Se înscrie...</> : <>Participă acum <ArrowRight className="h-4 w-4" /></>}
    </button>
  );
};
