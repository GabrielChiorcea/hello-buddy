export const couponsSchemaExtension = `#graphql
  enum CouponStatus {
    active
    used
    expired
  }

  type Coupon {
    id: ID!
    title: String!
    description: String
    imageUrl: String
    discountPercent: Float!
    pointsCost: Int!
    requiredTierId: ID
    requiredTierName: String
    targetProductId: ID!
    targetProductName: String
    isActive: Boolean!
    startsAt: String
    expiresAt: String
    createdAt: String!
    updatedAt: String!
  }

  type UserCoupon {
    id: ID!
    userId: ID!
    couponId: ID!
    status: CouponStatus!
    activatedAt: String!
    expiresAt: String
    usedAt: String
    usedOrderId: ID
    coupon: Coupon!
  }

  extend type Query {
    couponsCatalog: [Coupon!]!
    myCoupons: [UserCoupon!]!
  }

  extend type Mutation {
    activateCoupon(couponId: ID!): UserCoupon!
  }
`;

