/**
 * GraphQL schema extension for welcome bonus (puncte cadou la prima autentificare)
 * Plugin: plugins/welcome_bonus
 */

export const welcomeBonusSchemaExtension = `#graphql
  extend type User {
    welcomeBonusSeen: Boolean!
    welcomeBonusAmount: Int!
    """Puncte cadou acordate la înregistrare (0 dacă nu s-a primit). Folosit doar pentru UX (ex. bară rang), nu sunt XP."""
    welcomeBonusAwardedPoints: Int!
  }

  extend type Mutation {
    markWelcomeBonusSeen: Boolean!
  }
`;
