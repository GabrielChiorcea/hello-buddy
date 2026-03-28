/**
 * =============================================================================
 * EXPORT CENTRAL MODUL GRAPHQL
 * =============================================================================
 * 
 * Acest fișier este punctul central de export pentru întregul modul GraphQL.
 * 
 * Permite importuri simplificate din orice parte a aplicației:
 * 
 * @example
 * import { apolloClient, useProducts, GET_PRODUCTS, LoginInput } from '@/graphql';
 * 
 * Structura modulului:
 * 
 * /graphql
 * ├── client.ts    - Configurare Apollo Client
 * ├── queries.ts   - Interogări GraphQL (citire date)
 * ├── mutations.ts - Mutații GraphQL (modificare date)
 * ├── types.ts     - Tipuri TypeScript pentru GraphQL
 * ├── index.ts     - Acest fișier (export central)
 * └── /hooks
 *     ├── index.ts        - Export central hook-uri
 *     ├── useProducts.ts  - Hook-uri pentru produse
 *     ├── useAuth.ts      - Hook-uri pentru autentificare
 *     ├── useProfile.ts   - Hook-uri pentru profil
 *     ├── useAddresses.ts - Hook-uri pentru adrese
 *     └── useOrders.ts    - Hook-uri pentru comenzi
 * =============================================================================
 */

// ============================================================================
// APOLLO CLIENT
// ============================================================================

/**
 * Instanța Apollo Client configurată pentru aplicație
 * Folosit în App.tsx pentru ApolloProvider
 */
export { apolloClient } from './client';

// ============================================================================
// INTEROGĂRI GRAPHQL
// ============================================================================

/**
 * Query-uri pentru citirea datelor
 * - GET_PRODUCTS, GET_PRODUCT_BY_ID, GET_PRODUCTS_BY_CATEGORY
 * - GET_CATEGORIES
 * - GET_CURRENT_USER, GET_USER_ORDERS, GET_ORDER_BY_ID
 * - GET_USER_ADDRESSES
 * 
 * Fragmente reutilizabile:
 * - PRODUCT_FRAGMENT, USER_FRAGMENT, ORDER_FRAGMENT, ADDRESS_FRAGMENT
 */
export * from './queries';

// ============================================================================
// MUTAȚII GRAPHQL
// ============================================================================

/**
 * Mutații pentru modificarea datelor
 * - LOGIN, SIGNUP, LOGOUT
 * - UPDATE_PROFILE, REQUEST_PASSWORD_RESET, DELETE_ACCOUNT
 * - CREATE_ADDRESS, UPDATE_ADDRESS, DELETE_ADDRESS, SET_DEFAULT_ADDRESS
 * - CREATE_ORDER, CANCEL_ORDER
 * - ADD_REVIEW
 */
export * from './mutations';

// ============================================================================
// TIPURI TYPESCRIPT
// ============================================================================

/**
 * Tipuri pentru type-safety
 * - Tipuri răspunsuri: GetProductsResponse, AuthResponse, etc.
 * - Tipuri input: LoginInput, SignupInput, CreateOrderInput, etc.
 * - Tipuri variabile: GetProductByIdVariables, LoginVariables, etc.
 */
export * from './types';

// ============================================================================
// HOOK-URI REACT
// ============================================================================

/**
 * Hook-uri pentru utilizare în componente React
 * - useProducts, useProduct, useProductsByCategory
 * - useCurrentUser, useLogin, useSignup, useLogout
 * - useUpdateProfile
 * - useUserAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress
 * - useUserOrders, useOrder, useCreateOrder, useCancelOrder
 */
export * from './hooks';
