/**
 * Plugin Streak - campanii streak V2
 * Punct de intrare pentru înregistrare
 */

import { Flame } from 'lucide-react';
import type { RouteObject } from 'react-router-dom';
import AdminStreakCampaigns from './pages/AdminStreakCampaigns';
import { CampaignCard } from './components/CampaignCard';
import { CampaignJoinButton } from './components/CampaignJoinButton';
import { StreakProgressBar } from './components/StreakProgressBar';
import { StreakCampaignBlock } from './components/StreakCampaignBlock';
import { HomeMarketingCards } from './components/HomeMarketingCards';

export { CampaignCard, CampaignJoinButton, StreakProgressBar, StreakCampaignBlock, HomeMarketingCards };
export { default as AdminStreakCampaigns } from './pages/AdminStreakCampaigns';
export type { StreakCampaign, StreakEnrollment, RecurrenceType, RewardType, ResetType } from './types';
export { ACTIVE_STREAK_CAMPAIGN, MY_STREAK_ENROLLMENT } from './queries';
export { JOIN_STREAK_CAMPAIGN } from './mutations';

export const streakPlugin = {
  routes: [
    { path: 'streak', element: <AdminStreakCampaigns /> },
  ] as RouteObject[],
  navItems: [
    { title: 'Streak', url: '/admin/streak', icon: Flame },
  ],
  routePaths: {
    adminStreak: '/admin/streak',
  },
  components: {
    CampaignCard,
    CampaignJoinButton,
    StreakProgressBar,
    StreakCampaignBlock,
    HomeMarketingCards,
  },
};
