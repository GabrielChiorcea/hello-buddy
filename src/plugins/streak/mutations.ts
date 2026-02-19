/**
 * GraphQL mutations for streak campaign plugin
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
      completedAt
      bonusAwardedAt
      campaign {
        id
        name
        streakType
        ordersRequired
        bonusPoints
        customText
        startDate
        endDate
      }
    }
  }
`;
