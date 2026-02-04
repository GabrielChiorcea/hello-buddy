/**
 * Utilități pentru gestionarea cookie-urilor HttpOnly
 * Best practice OWASP pentru refresh tokens
 */

import { Response, CookieOptions } from 'express';
import { jwtConfig } from '../config/jwt.js';
import { env, isProduction } from '../config/env.js';

// Numele cookie-urilor
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const ADMIN_REFRESH_TOKEN_COOKIE = 'admin_refresh_token';

/**
 * Opțiuni de bază pentru cookie-uri securizate
 */
const getBaseCookieOptions = (): CookieOptions => ({
  httpOnly: true, // Inaccesibil din JavaScript
  secure: isProduction, // HTTPS only în producție
  sameSite: isProduction ? 'strict' : 'lax', // Protecție CSRF
  path: '/',
});

/**
 * Setează cookie-ul cu refresh token pentru utilizatori
 */
export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  const options: CookieOptions = {
    ...getBaseCookieOptions(),
    maxAge: jwtConfig.refresh.expiresIn * 1000, // Conversie în milisecunde
  };
  
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, options);
}

/**
 * Setează cookie-ul cu refresh token pentru admin
 */
export function setAdminRefreshTokenCookie(res: Response, refreshToken: string): void {
  const options: CookieOptions = {
    ...getBaseCookieOptions(),
    maxAge: jwtConfig.refresh.expiresIn * 1000,
    path: '/admin', // Limitat la rutele admin
  };
  
  res.cookie(ADMIN_REFRESH_TOKEN_COOKIE, refreshToken, options);
}

/**
 * Șterge cookie-ul refresh token pentru utilizatori
 */
export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...getBaseCookieOptions(),
  });
}

/**
 * Șterge cookie-ul refresh token pentru admin
 */
export function clearAdminRefreshTokenCookie(res: Response): void {
  res.clearCookie(ADMIN_REFRESH_TOKEN_COOKIE, {
    ...getBaseCookieOptions(),
    path: '/admin',
  });
}

/**
 * Extrage refresh token din cookie (pentru utilizatori)
 */
export function getRefreshTokenFromCookie(cookies: Record<string, string>): string | null {
  return cookies?.[REFRESH_TOKEN_COOKIE] || null;
}

/**
 * Extrage refresh token din cookie (pentru admin)
 */
export function getAdminRefreshTokenFromCookie(cookies: Record<string, string>): string | null {
  return cookies?.[ADMIN_REFRESH_TOKEN_COOKIE] || null;
}
