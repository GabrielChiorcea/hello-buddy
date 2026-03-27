/**
 * GraphQL mutations for streak campaign plugin V2
 */

import { gql } from '@apollo/client';

export const JOIN_STREAK_CAMPAIGN = gql`
  mutation JoinStreakCampaign($campaignId: ID!) {
    joinStreakCampaign(campaignId: $campaignId) {
      id
      userId
      campaignId
      joinedAt
      currentStreakCount
      currentLevel
      completedAt
      bonusAwardedAt
      lastOrderDate
      campaign {
        id
        name
        recurrenceType
        rollingWindowDays
        ordersRequired
        bonusPoints
        rewardType
        customText
        imageUrl
        startDate
        endDate
        rewardSteps {
          stepNumber
          pointsAwarded
          label
        }
      }
    }
  }
`;

export const LEAVE_STREAK_CAMPAIGN = gql`
  mutation LeaveStreakCampaign($campaignId: ID!) {
    leaveStreakCampaign(campaignId: $campaignId)
  }
`;
