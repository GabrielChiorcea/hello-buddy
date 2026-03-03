/**
 * Join button for streak campaign - redirects to login if not authenticated
 * Plugin: plugins/streak
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store';
import { routes } from '@/config/routes';
import { JOIN_STREAK_CAMPAIGN } from '../mutations';
import { ACTIVE_STREAK_CAMPAIGNS, MY_STREAK_ENROLLMENT } from '../queries';
import type { StreakCampaign } from '../types';
import { Loader2 } from 'lucide-react';

export interface CampaignJoinButtonProps {
  campaign: StreakCampaign;
  enrollment: { completedAt: string | null } | null | undefined;
  /** When true, user is already in another campaign; show disabled state. */
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

  if (enrollment && !completed) {
    return (
      <Button disabled className={className} variant="secondary">
        Înscris
      </Button>
    );
  }
  if (completed) {
    return (
      <Button disabled className={className} variant="outline">
        Streak complet
      </Button>
    );
  }
  if (enrolledInOtherCampaign) {
    return (
      <Button disabled className={className} variant="outline" title="Poți participa doar la o campanie în același timp">
        Înscris la altă campanie
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Se înscrie...
        </>
      ) : (
        'Participă'
      )}
    </Button>
  );
};
