/**
 * Export și combinare toate rezolverele GraphQL
 */

import { authResolvers } from './auth.js';
import { productResolvers } from './product.js';
import { userResolvers } from './user.js';
import { addressResolvers } from './address.js';
import { orderResolvers } from './order.js';

// Combină toate rezolverele
export const resolvers = {
  Query: {
    ...productResolvers.Query,
    ...userResolvers.Query,
    ...addressResolvers.Query,
    ...orderResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...addressResolvers.Mutation,
    ...orderResolvers.Mutation,
  },
  // Field resolvers
  Product: productResolvers.Product,
};
