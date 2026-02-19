/**
 * Types for streak campaign plugin
 */

export type StreakType = 'consecutive_days' | 'days_per_week' | 'working_days';

export interface StreakCampaign {
  id: string;
  name: string;
  streakType: StreakType;
  ordersRequired: number;
  bonusPoints: number;
  customText: string | null;
  startDate: string;
  endDate: string;
  resetOnMiss: boolean;
  pointsExpireAfterCampaign: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StreakEnrollment {
  id: string;
  userId: string;
  campaignId: string;
  joinedAt: string;
  currentStreakCount: number;
  completedAt: string | null;
  bonusAwardedAt: string | null;
  campaign?: StreakCampaign | null;
}
