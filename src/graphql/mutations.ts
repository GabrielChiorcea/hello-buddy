/**
 * =============================================================================
 * MUTAȚII GRAPHQL - Sincronizate cu backend schema
 * =============================================================================
 */

import { gql } from '@apollo/client';
import { USER_FRAGMENT, ORDER_FRAGMENT, ADDRESS_FRAGMENT } from './queries';

// ============================================================================
// MUTAȚII - AUTENTIFICARE
// ============================================================================

/**
 * Login - returnează AuthPayload cu accessToken, expiresIn
 * SECURITY: refreshToken este setat în HttpOnly cookie de backend
 */
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        ...UserFields
      }
      accessToken
      expiresIn
    }
  }
  ${USER_FRAGMENT}
`;

/**
 * Signup - returnează AuthPayload
 * SECURITY: refreshToken este setat în HttpOnly cookie de backend
 */
export const SIGNUP = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      user {
        ...UserFields
      }
      accessToken
      expiresIn
    }
  }
  ${USER_FRAGMENT}
`;

/**
 * Logout - invalidează sesiunea
 */
export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

/**
 * Refresh token - obține nou accessToken
 */
export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      expiresIn
    }
  }
`;

// ============================================================================
// MUTAȚII - PROFIL UTILIZATOR
// ============================================================================

/**
 * Actualizare profil - folosește JWT context pentru userId
 */
export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: ProfileUpdateInput!) {
    updateProfile(input: $input) {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

/**
 * Schimbare parolă
 */
export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

/**
 * Solicitare resetare parolă
 */
export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

/**
 * Resetare parolă cu token
 */
export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;

/**
 * Ștergere cont
 */
export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($password: String!, $confirmText: String!) {
    deleteAccount(password: $password, confirmText: $confirmText)
  }
`;

// ============================================================================
// MUTAȚII - ADRESE
// ============================================================================

export const CREATE_ADDRESS = gql`
  mutation CreateAddress($input: AddressInput!) {
    createAddress(input: $input) {
      ...AddressFields
    }
  }
  ${ADDRESS_FRAGMENT}
`;

export const UPDATE_ADDRESS = gql`
  mutation UpdateAddress($id: ID!, $input: AddressInput!) {
    updateAddress(id: $id, input: $input) {
      ...AddressFields
    }
  }
  ${ADDRESS_FRAGMENT}
`;

export const DELETE_ADDRESS = gql`
  mutation DeleteAddress($id: ID!) {
    deleteAddress(id: $id)
  }
`;

export const SET_DEFAULT_ADDRESS = gql`
  mutation SetDefaultAddress($id: ID!) {
    setDefaultAddress(id: $id) {
      ...AddressFields
    }
  }
  ${ADDRESS_FRAGMENT}
`;

// ============================================================================
// MUTAȚII - COMENZI
// ============================================================================

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      ...OrderFields
    }
  }
  ${ORDER_FRAGMENT}
`;

export const CANCEL_ORDER = gql`
  mutation CancelOrder($id: ID!) {
    cancelOrder(id: $id) {
      ...OrderFields
    }
  }
  ${ORDER_FRAGMENT}
`;

