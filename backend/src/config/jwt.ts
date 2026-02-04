/**
 * Configurare JWT pentru access și refresh tokens
 */

import { env } from './env.js';

export const jwtConfig = {
  // Access token - durată scurtă (1 oră default)
  access: {
    secret: env.JWT_ACCESS_SECRET,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN, // în secunde
  },
  
  // Refresh token - durată lungă (7 zile default)
  refresh: {
    secret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN, // în secunde
  },
};

// Tipuri pentru payload-ul token-urilor
export interface AccessTokenPayload {
  userId: string;
  email: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string; // ID-ul din tabela refresh_tokens pentru revocare
  type: 'refresh';
}
