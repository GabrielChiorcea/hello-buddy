/**
 * GraphQL queries for streak campaign plugin V2
 */

import { gql } from '@apollo/client';

export const ACTIVE_STREAK_CAMPAIGN = gql`
  query ActiveStreakCampaign {
    activeStreakCampaign {
      id
      name
      recurrenceType
      rollingWindowDays
      ordersRequired
      bonusPoints
      rewardType
      baseMultiplier
      multiplierIncrement
      customText
      imageUrl
      startDate
      endDate
      resetType
      minOrderValue
      rewardSteps {
        stepNumber
        pointsAwarded
        label
      }
      createdAt
      updatedAt
    }
  }
`;

export const ACTIVE_STREAK_CAMPAIGNS = gql`
  query ActiveStreakCampaigns {
    activeStreakCampaigns {
      id
      name
      recurrenceType
      rollingWindowDays
      ordersRequired
      bonusPoints
      rewardType
      baseMultiplier
      multiplierIncrement
      customText
      imageUrl
      startDate
      endDate
      resetType
      minOrderValue
      rewardSteps {
        stepNumber
        pointsAwarded
        label
      }
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
        baseMultiplier
        multiplierIncrement
        customText
        imageUrl
        startDate
        endDate
        resetType
        rewardSteps {
          stepNumber
          pointsAwarded
          label
        }
      }
    }
  }
`;
