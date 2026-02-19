/**
 * GraphQL queries for streak campaign plugin
 */

import { gql } from '@apollo/client';

export const ACTIVE_STREAK_CAMPAIGN = gql`
  query ActiveStreakCampaign {
    activeStreakCampaign {
      id
      name
      streakType
      ordersRequired
      bonusPoints
      customText
      startDate
      endDate
      resetOnMiss
      pointsExpireAfterCampaign
      createdAt
      updatedAt
    }
  }
`;

export const MY_STREAK_ENROLLMENT = gql`
  query MyStreakEnrollment($campaignId: ID) {
    myStreakEnrollment(campaignId: $campaignId) {
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
