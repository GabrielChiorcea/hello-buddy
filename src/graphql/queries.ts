/**
 * =============================================================================
 * INTEROGĂRI GRAPHQL (QUERIES) - Sincronizate cu backend schema
 * =============================================================================
 */

import { gql } from '@apollo/client';

// ============================================================================
// FRAGMENTE - Sincronizate cu tipurile din backend/src/graphql/schema.ts
// ============================================================================

export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    email
    name
    phone
    pointsBalance
    welcomeBonusSeen
    welcomeBonusAmount
    totalXp
    tier {
      id
      name
      xpThreshold
      pointsMultiplier
      badgeIcon
      benefitDescription
    }
    nextTier {
      id
      name
      xpThreshold
      pointsMultiplier
      badgeIcon
      benefitDescription
    }
    xpToNextLevel
    createdAt
  }
`;

export const INGREDIENT_FRAGMENT = gql`
  fragment IngredientFields on Ingredient {
    id
    name
    isAllergen
  }
`;

export const PRODUCT_FRAGMENT = gql`
  fragment ProductFields on Product {
    id
    name
    description
    price
    image
    category
    categoryId
    isAvailable
    isAddon
    preparationTime
    ingredients {
      ...IngredientFields
    }
    createdAt
  }
  ${INGREDIENT_FRAGMENT}
`;

export const CATEGORY_FRAGMENT = gql`
  fragment CategoryFields on Category {
    id
    name
    displayName
    description
    image
    icon
    productsCount
  }
`;

export const ADDRESS_FRAGMENT = gql`
  fragment AddressFields on Address {
    id
    label
    address
    city
    phone
    notes
    isDefault
  }
`;

export const ORDER_ITEM_FRAGMENT = gql`
  fragment OrderItemFields on OrderItem {
    id
    productId
    productName
    productImage
    quantity
    priceAtOrder
  }
`;

/** Fragment pentru listă comenzi - exclude date sensibile (phone, notes, paymentMethod) */
export const ORDER_ITEM_FRAGMENT_LITE = gql`
  fragment OrderItemFieldsLite on OrderItem {
    productName
    quantity
    priceAtOrder
  }
`;

export const ORDER_FRAGMENT = gql`
  fragment OrderFields on Order {
    id
    subtotal
    deliveryFee
    total
    status
    fulfillmentType
    tableNumber
    deliveryAddress
    deliveryCity
    phone
    notes
    paymentMethod
    items {
      ...OrderItemFields
    }
    createdAt
    estimatedDelivery
    deliveredAt
  }
  ${ORDER_ITEM_FRAGMENT}
`;

/** Fragment pentru listă comenzi - exclude date sensibile (phone, notes, paymentMethod, productId, productImage) */
export const ORDER_FRAGMENT_LITE = gql`
  fragment OrderFieldsLite on Order {
    id
    subtotal
    deliveryFee
    total
    status
    fulfillmentType
    tableNumber
    deliveryAddress
    deliveryCity
    pointsEarned
    pointsUsed
    discountFromPoints
    items {
      ...OrderItemFieldsLite
    }
    createdAt
    deliveredAt
  }
  ${ORDER_ITEM_FRAGMENT_LITE}
`;

// ============================================================================
// QUERIES - PRODUSE
// ============================================================================

export const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: ID!) {
    product(id: $id) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory($category: String!) {
    productsByCategory(category: $category) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const GET_ADDON_PRODUCTS = gql`
  query GetAddonProducts {
    addonProducts {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const GET_SUGGESTED_ADDONS_FOR_CART = gql`
  query GetSuggestedAddonsForCart($cartProductIds: [ID!]!) {
    suggestedAddonsForCart(cartProductIds: $cartProductIds) {
      product {
        ...ProductFields
      }
      ruleId
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($query: String!) {
    searchProducts(query: $query) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

// ============================================================================
// QUERIES - CATEGORII
// ============================================================================

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      ...CategoryFields
    }
  }
  ${CATEGORY_FRAGMENT}
`;

// ============================================================================
// QUERIES - UTILIZATOR
// ============================================================================

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

// ============================================================================
// QUERIES - COMENZI (folosește JWT context pentru userId)
// ============================================================================

export const GET_USER_ORDERS = gql`
  query GetOrders {
    orders {
      ...OrderFieldsLite
    }
  }
  ${ORDER_FRAGMENT_LITE}
`;

export const GET_ORDER_BY_ID = gql`
  query GetOrderById($id: ID!) {
    order(id: $id) {
      ...OrderFieldsLite
    }
  }
  ${ORDER_FRAGMENT_LITE}
`;

// ============================================================================
// QUERIES - ADRESE (folosește JWT context pentru userId)
// ============================================================================

export const GET_USER_ADDRESSES = gql`
  query GetAddresses {
    addresses {
      ...AddressFields
    }
  }
  ${ADDRESS_FRAGMENT}
`;

export const GET_ADDRESS_BY_ID = gql`
  query GetAddressById($id: ID!) {
    address(id: $id) {
      ...AddressFields
    }
  }
  ${ADDRESS_FRAGMENT}
`;

// Puncte loialitate: GET_POINTS_REWARDS este în plugins/points/queries.ts

export const GET_LOYALTY_TIERS = gql`
  query GetLoyaltyTiers {
    loyaltyTiers {
      id
      name
      xpThreshold
      pointsMultiplier
      badgeIcon
      sortOrder
      benefitDescription
    }
  }
`;

/** Setări economie XP + puncte (pentru afișare în TierProgressBar / profil) */
export const GET_TIERS_ECONOMY_SETTINGS = gql`
  query GetTiersEconomySettings {
    tiers_xp_per_ron: appSetting(key: "tiers_xp_per_ron")
    tiers_xp_per_order: appSetting(key: "tiers_xp_per_order")
    points_per_order: appSetting(key: "points_per_order")
    points_per_ron: appSetting(key: "points_per_ron")
  }
`;
