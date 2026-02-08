/**
 * Interogări GraphQL pentru puncte loialitate
 */

import { gql } from '@apollo/client';

export const GET_POINTS_REWARDS = gql`
  query GetPointsRewards {
    pointsRewards {
      id
      pointsCost
      discountAmount
      isActive
    }
  }
`;
