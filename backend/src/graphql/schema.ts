/**
 * Schema GraphQL completă pentru API-ul public
 */

import { schemaExtension as pointsSchemaExtension } from '../plugins/points/index.js';
import { schemaExtension as streakSchemaExtension } from '../plugins/streak/index.js';
import { schemaExtension as welcomeBonusSchemaExtension } from '../plugins/welcome_bonus/index.js';
import { schemaExtension as tiersSchemaExtension } from '../plugins/tiers/index.js';
import { addonsSchemaExtension } from '../plugins/addons/index.js';

const coreTypeDefs = `#graphql
  # ============================================
  # Tipuri de bază
  # ============================================
  
  type User {
    id: ID!
    email: String!
    name: String!
    phone: String
    pointsBalance: Float!
    createdAt: String!
    # Beneficii produse gratuite pe rank (plugin free-products)
    hasFreeProductBenefits: Boolean!
    freeProductCampaignsSummary: [FreeProductCampaignSummary!]!
  }

  type Ingredient {
    id: Int!
    name: String!
    isAllergen: Boolean!
  }

  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    image: String
    category: String!
    categoryId: ID!
    isAvailable: Boolean!
    isAddon: Boolean!
    preparationTime: Int!
    ingredients: [Ingredient!]!
    createdAt: String!
  }

  type Category {
    id: ID!
    name: String!
    displayName: String!
    description: String
    image: String
    icon: String
    productsCount: Int
  }

  type AppStats {
    totalProducts: Int!
  }

  type Address {
    id: ID!
    label: String!
    address: String!
    city: String!
    phone: String!
    notes: String
    isDefault: Boolean!
  }

  type OrderItem {
    id: Int!
    productId: ID
    productName: String!
    productImage: String
    quantity: Int!
    priceAtOrder: Float!
  }

  type Order {
    id: ID!
    subtotal: Float!
    deliveryFee: Float!
    total: Float!
    status: OrderStatus!
    fulfillmentType: FulfillmentType!
    tableNumber: String
    deliveryAddress: String!
    deliveryCity: String!
    phone: String!
    notes: String
    paymentMethod: PaymentMethod!
    pointsEarned: Float!
    pointsUsed: Int!
    discountFromPoints: Float!
    discountFromFreeProducts: Float!
    items: [OrderItem!]!
    createdAt: String!
    estimatedDelivery: String
    deliveredAt: String
  }

  type FreeProductCampaignSummary {
    id: ID!
    name: String!
    customText: String
    minOrderValue: Float!
    products: [String!]!
  }

  enum FulfillmentType {
    delivery
    in_location
  }

  enum OrderStatus {
    pending
    confirmed
    preparing
    delivering
    delivered
    cancelled
  }

  enum PaymentMethod {
    cash
    card
  }

  # ============================================
  # Tipuri pentru autentificare
  # SECURITY: refreshToken este setat în HttpOnly cookie, nu în response body
  # ============================================

  type AuthPayload {
    user: User!
    accessToken: String!
    expiresIn: Int!
  }

  type RefreshPayload {
    accessToken: String!
    expiresIn: Int!
  }

  # ============================================
  # Input types
  # ============================================

  input LoginInput {
    email: String!
    password: String!
  }

  input SignupInput {
    email: String!
    password: String!
    name: String!
    phone: String
  }

  input ProfileUpdateInput {
    name: String
    phone: String
  }

  input AddressInput {
    label: String!
    address: String!
    city: String!
    phone: String!
    notes: String
    isDefault: Boolean
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
  }

  input CreateOrderInput {
    items: [OrderItemInput!]!
    fulfillmentType: FulfillmentType
    tableNumber: String
    deliveryAddress: String!
    deliveryCity: String!
    phone: String!
    notes: String
    paymentMethod: PaymentMethod!
    pointsToUse: Int
  }

  # ============================================
  # Queries
  # ============================================

  type Query {
    # Produse
    products: [Product!]!
    product(id: ID!): Product
    productsByCategory(category: String!): [Product!]!
    recommendedProducts: [Product!]!
    addonProducts: [Product!]!
    searchProducts(query: String!): [Product!]!
    appStats: AppStats!

    # Categorii
    categories: [Category!]!
    
    # Utilizator curent (necesită autentificare)
    currentUser: User
    
    # Comenzi (necesită autentificare)
    orders: [Order!]!
    order(id: ID!): Order
    
    # Adrese (necesită autentificare)
    addresses: [Address!]!
    address(id: ID!): Address

    # Setări aplicație (feature flags)
    appSetting(key: String!): String
  }

  # ============================================
  # Mutations
  # ============================================

  type Mutation {
    # Autentificare
    login(input: LoginInput!): AuthPayload!
    signup(input: SignupInput!): AuthPayload!
    logout: Boolean!
    refreshToken(refreshToken: String!): RefreshPayload!
    
    # Profil (necesită autentificare)
    updateProfile(input: ProfileUpdateInput!): User!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
    requestPasswordReset(email: String!): Boolean!
    resetPassword(token: String!, newPassword: String!): Boolean!
    deleteAccount(password: String!, confirmText: String!): Boolean!
    
    # Adrese (necesită autentificare)
    createAddress(input: AddressInput!): Address!
    updateAddress(id: ID!, input: AddressInput!): Address!
    deleteAddress(id: ID!): Boolean!
    setDefaultAddress(id: ID!): Address!
    
    # Comenzi (necesită autentificare)
    createOrder(input: CreateOrderInput!): Order!
    cancelOrder(id: ID!): Order!
    createPaymentSession(input: CreateOrderInput!, amountRon: Float!): CreatePaymentSessionPayload!
    confirmPaymentSession(sessionId: ID!): Order!
  }

  type CreatePaymentSessionPayload {
    clientSecret: String
    redirectUrl: String
    paymentId: ID!
    draftId: ID!
  }
`;

export const typeDefs =
  coreTypeDefs +
  '\n' +
  pointsSchemaExtension +
  '\n' +
  streakSchemaExtension +
  '\n' +
  welcomeBonusSchemaExtension +
  '\n' +
  tiersSchemaExtension +
  '\n' +
  addonsSchemaExtension;
