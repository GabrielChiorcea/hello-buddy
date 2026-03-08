/**
 * GraphQL schema extension for streak campaigns V2
 * Plugin: plugins/streak
 */

export const streakSchemaExtension = `#graphql
  enum RecurrenceType {
    calendar_weekly
    rolling
    consecutive
  }

  enum RewardType {
    single
    steps
    multiplier
  }

  enum ResetType {
    hard
    soft_decay
  }

  type RewardStep {
    stepNumber: Int!
    pointsAwarded: Int!
    label: String
  }

  type StreakCampaign {
    id: ID!
    name: String!
    recurrenceType: RecurrenceType!
    rollingWindowDays: Int!
    ordersRequired: Int!
    bonusPoints: Int!
    rewardType: RewardType!
    baseMultiplier: Float!
    multiplierIncrement: Float!
    customText: String
    startDate: String!
    endDate: String!
    resetType: ResetType!
    minOrderValue: Float!
    cooldownHours: Int!
    rewardSteps: [RewardStep!]!
    createdAt: String!
    updatedAt: String!
  }

  type StreakEnrollment {
    id: ID!
    userId: ID!
    campaignId: ID!
    joinedAt: String!
    currentStreakCount: Int!
    currentLevel: Int!
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
