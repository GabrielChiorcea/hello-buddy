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
    address
    city
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

export const ORDER_FRAGMENT = gql`
  fragment OrderFields on Order {
    id
    subtotal
    deliveryFee
    total
    status
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
      ...OrderFields
    }
  }
  ${ORDER_FRAGMENT}
`;

export const GET_ORDER_BY_ID = gql`
  query GetOrderById($id: ID!) {
    order(id: $id) {
      ...OrderFields
    }
  }
  ${ORDER_FRAGMENT}
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
