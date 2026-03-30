import { GraphQLContext, requireAuth } from '../../../graphql/context.js';
import * as CouponsService from '../service.js';

export const couponsResolvers = {
  Query: {
    async couponsCatalog() {
      return CouponsService.listCatalogCoupons();
    },
    async myCoupons(_: unknown, __: unknown, context: GraphQLContext) {
      const user = requireAuth(context);
      return CouponsService.listMyCoupons(user.id);
    },
  },
  Mutation: {
    async activateCoupon(_: unknown, { couponId }: { couponId: string }, context: GraphQLContext) {
      const user = requireAuth(context);
      return CouponsService.activateCoupon(user.id, couponId);
    },
  },
};

