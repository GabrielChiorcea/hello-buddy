/**
 * Types for streak campaign plugin V2
 */

export type RecurrenceType = 'rolling' | 'consecutive';
export type RewardType = 'single' | 'steps' | 'multiplier';
export type ResetType = 'hard' | 'soft_decay';

export interface RewardStep {
  stepNumber: number;
  pointsAwarded: number;
  label: string | null;
}

export interface StreakCampaign {
  id: string;
  name: string;
  recurrenceType: RecurrenceType;
  rollingWindowDays: number;
  ordersRequired: number;
  bonusPoints: number;
  rewardType: RewardType;
  baseMultiplier: number;
  multiplierIncrement: number;
  customText: string | null;
  startDate: string;
  endDate: string;
  resetType: ResetType;
  minOrderValue: number;
  rewardSteps: RewardStep[];
  createdAt: string;
  updatedAt: string;
}

export interface StreakEnrollment {
  id: string;
  userId: string;
  campaignId: string;
  joinedAt: string;
  currentStreakCount: number;
  currentLevel: number;
  completedAt: string | null;
  bonusAwardedAt: string | null;
  campaign?: StreakCampaign | null;
}
