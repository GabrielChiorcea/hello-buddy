/**
 * GraphQL schema extension for welcome bonus (puncte cadou la prima autentificare)
 * Plugin: plugins/welcome_bonus
 */

export const welcomeBonusSchemaExtension = `#graphql
  extend type User {
    welcomeBonusSeen: Boolean!
    welcomeBonusAmount: Int!
  }

  extend type Mutation {
    markWelcomeBonusSeen: Boolean!
  }
`;
