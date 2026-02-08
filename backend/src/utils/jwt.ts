/**
 * Utilități pentru generare și verificare JWT
 * Include TOKEN ROTATION pentru securitate maximă
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { jwtConfig, AccessTokenPayload, RefreshTokenPayload } from '../config/jwt.js';
import { query, queryOne } from '../config/database.js';
import { hashPassword } from './password.js';
import { logTokenRotation, logTokenInvalid } from './securityLogger.js';
import { securityLogger } from '../config/logger.js';
import { Request } from 'express';

/**
 * Generează un access token
 */
export function generateAccessToken(userId: string): string {
  const payload: AccessTokenPayload = {
    userId,
    type: 'access',
  };
  
  return jwt.sign(payload, jwtConfig.access.secret, {
    expiresIn: jwtConfig.access.expiresIn,
  });
}

/**
 * Generează un refresh token și îl salvează în baza de date
 */
export async function generateRefreshToken(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string; tokenId: string }> {
  const tokenId = uuidv4();
  const token = jwt.sign(
    { userId, tokenId, type: 'refresh' } as RefreshTokenPayload,
    jwtConfig.refresh.secret,
    { expiresIn: jwtConfig.refresh.expiresIn }
  );
  
  // Hash-uim token-ul înainte de a-l salva
  const tokenHash = await hashPassword(token);
  const expiresAt = new Date(Date.now() + jwtConfig.refresh.expiresIn * 1000);
  
  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tokenId, userId, tokenHash, expiresAt, userAgent || null, ipAddress || null]
  );
  
  return { token, tokenId };
}

/**
 * Verifică un access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = jwt.verify(token, jwtConfig.access.secret) as AccessTokenPayload;
    if (payload.type !== 'access') return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifică un refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const payload = jwt.verify(token, jwtConfig.refresh.secret) as RefreshTokenPayload;
    if (payload.type !== 'refresh') return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifică dacă refresh token-ul este valid în baza de date
 */
export async function isRefreshTokenValid(tokenId: string, userId: string): Promise<boolean> {
  const result = await queryOne<{ id: string }>(
    `SELECT id FROM refresh_tokens 
     WHERE id = ? AND user_id = ? AND revoked = FALSE AND expires_at > NOW()`,
    [tokenId, userId]
  );
  return result !== null;
}

/**
 * Revocă un refresh token
 */
export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE id = ?`,
    [tokenId]
  );
}

/**
 * Revocă toate refresh token-urile unui utilizator
 */
export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() 
     WHERE user_id = ? AND revoked = FALSE`,
    [userId]
  );
}

/**
 * TOKEN ROTATION: Rotează refresh token-ul la fiecare utilizare
 * 
 * Beneficii securitate:
 * - Dacă un token este compromis, atacatorul are o singură utilizare
 * - Detectează token theft (când vechiul token este folosit din nou)
 * - Reduce fereastra de atac pentru token-uri furate
 * 
 * @returns Noul refresh token și access token
 */
export async function rotateRefreshToken(
  oldTokenId: string,
  userId: string,
  userAgent?: string,
  ipAddress?: string,
  req?: Request
): Promise<{ 
  accessToken: string; 
  refreshToken: string; 
  tokenId: string;
  expiresIn: number;
} | null> {
  // Verifică dacă vechiul token există și este valid
  const oldToken = await queryOne<{ id: string; user_id: string; revoked: boolean }>(
    `SELECT id, user_id, revoked FROM refresh_tokens 
     WHERE id = ? AND user_id = ?`,
    [oldTokenId, userId]
  );
  
  if (!oldToken) {
    logTokenInvalid(req!, 'Token not found in database');
    return null;
  }
  
  // Detectare token theft: dacă token-ul a fost deja revocat,
  // înseamnă că cineva încearcă să-l refolosească
  if (oldToken.revoked) {
    // Potențial token theft detectat!
    // Revocă TOATE token-urile utilizatorului pentru siguranță
    securityLogger.warn(`[SECURITY ALERT] Potential token theft detected for user ${userId}! Revoking all tokens as a precaution.`, { userId });
    await revokeAllUserRefreshTokens(userId);
    
    logTokenInvalid(req!, 'Token reuse detected - potential theft');
    return null;
  }
  
  // Revocă vechiul token
  await revokeRefreshToken(oldTokenId);
  
  // Generează token-uri noi
  const { token: newRefreshToken, tokenId: newTokenId } = await generateRefreshToken(
    userId,
    userAgent,
    ipAddress
  );
  
  const accessToken = generateAccessToken(userId);
  const expiresIn = jwtConfig.access.expiresIn;

  // Log token rotation
  if (req) {
    logTokenRotation(req, userId, oldTokenId, newTokenId);
  }

  return {
    accessToken,
    refreshToken: newRefreshToken,
    tokenId: newTokenId,
    expiresIn,
  };
}

/**
 * Extrage token-ul din header Authorization
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
