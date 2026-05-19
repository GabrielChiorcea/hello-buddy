/**
 * Plugin Streak — componente user (fără pagini admin; admin → AdminRoutes lazy)
 */

export { CampaignCard } from './components/CampaignCard';
export { CampaignJoinButton } from './components/CampaignJoinButton';
export { StreakProgressBar } from './components/StreakProgressBar';
export { StreakCampaignBlock } from './components/StreakCampaignBlock';
export { HomeMarketingCards } from './components/HomeMarketingCards';
export type { StreakCampaign, StreakEnrollment, RecurrenceType, RewardType, ResetType } from './types';
export { ACTIVE_STREAK_CAMPAIGN, ACTIVE_STREAK_CAMPAIGNS, MY_STREAK_ENROLLMENT } from './queries';
export { JOIN_STREAK_CAMPAIGN } from './mutations';

export const streakPlugin = {
  routePaths: {
    adminStreak: '/admin/streak',
  },
};
