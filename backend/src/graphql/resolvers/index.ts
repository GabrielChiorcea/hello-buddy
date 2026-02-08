/**
 * Export și combinare toate rezolverele GraphQL
 */

import { authResolvers } from './auth.js';
import { productResolvers } from './product.js';
import { userResolvers } from './user.js';
import { addressResolvers } from './address.js';
import { orderResolvers } from './order.js';
import { resolvers as pointsResolvers } from '../../plugins/points/index.js';

// Combină toate rezolverele
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resolvers: any = {
  Query: {
    ...productResolvers.Query,
    ...userResolvers.Query,
    ...addressResolvers.Query,
    ...orderResolvers.Query,
    ...pointsResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...addressResolvers.Mutation,
    ...orderResolvers.Mutation,
  },
  // Field resolvers
  Product: productResolvers.Product,
  Order: orderResolvers.Order,
};
