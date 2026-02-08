/**
 * Extensie schema GraphQL pentru puncte
 * Plugin: plugins/points
 */

export const pointsSchemaExtension = `#graphql
  type PointsReward {
    id: ID!
    pointsCost: Int!
    discountAmount: Float!
    isActive: Boolean!
  }

  extend type Query {
    pointsRewards: [PointsReward!]!
  }
`;
