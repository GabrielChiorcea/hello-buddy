/**
 * Extensie schema GraphQL pentru niveluri de loialitate (tiers)
 * Plugin: plugins/tiers
 */

export const tiersSchemaExtension = `#graphql
  type LoyaltyTier {
    id: ID!
    name: String!
    xpThreshold: Int!
    pointsMultiplier: Float!
    badgeIcon: String
    sortOrder: Int!
    benefitDescription: String
  }

  extend type User {
    totalXp: Int!
    tier: LoyaltyTier
    nextTier: LoyaltyTier
    xpToNextLevel: Int
  }

  extend type Query {
    loyaltyTiers: [LoyaltyTier!]!
  }
`;

