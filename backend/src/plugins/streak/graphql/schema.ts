/**
 * GraphQL schema extension for streak campaigns
 * Plugin: plugins/streak
 */

export const streakSchemaExtension = `#graphql
  enum StreakType {
    consecutive_days
    days_per_week
    working_days
  }

  type StreakCampaign {
    id: ID!
    name: String!
    streakType: StreakType!
    ordersRequired: Int!
    bonusPoints: Int!
    customText: String
    startDate: String!
    endDate: String!
    resetOnMiss: Boolean!
    pointsExpireAfterCampaign: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type StreakEnrollment {
    id: ID!
    userId: ID!
    campaignId: ID!
    joinedAt: String!
    currentStreakCount: Int!
    completedAt: String
    bonusAwardedAt: String
    campaign: StreakCampaign
  }

  extend type Query {
    activeStreakCampaign: StreakCampaign
    activeStreakCampaigns: [StreakCampaign!]!
    myStreakEnrollment(campaignId: ID): StreakEnrollment
  }

  extend type Mutation {
    joinStreakCampaign(campaignId: ID!): StreakEnrollment
  }
`;
