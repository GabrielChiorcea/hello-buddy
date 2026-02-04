/**
 * Middleware pentru rate limiting
 * Include rate limiters pentru diferite scenarii de securitate
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { logRateLimitExceeded } from '../utils/securityLogger.js';

/**
 * Handler pentru când rate limit este atins
 */
const createRateLimitHandler = (endpoint: string) => (req: Request, res: Response) => {
  logRateLimitExceeded(req, endpoint);
  res.status(429).json({
    error: 'Prea multe cereri. Încercați din nou mai târziu.',
  });
};

/**
 * Rate limiter general pentru API
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minute default
  max: env.RATE_LIMIT_MAX_REQUESTS, // 100 cereri default
  message: {
    error: 'Prea multe cereri. Încercați din nou mai târziu.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('api'),
});

/**
 * Rate limiter strict pentru autentificare
 * Previne brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 10, // 10 încercări pe fereastră
  message: {
    error: 'Prea multe încercări de autentificare. Încercați din nou în 15 minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('auth'),
  // Key generator bazat pe IP + email (dacă există)
  keyGenerator: (req: Request) => {
    const email = req.body?.email || '';
    return `${req.ip}-${email}`;
  },
});

/**
 * Rate limiter pentru endpoint-uri sensibile (resetare parolă, etc.)
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 oră
  max: 5, // 5 încercări
  message: {
    error: 'Prea multe încercări. Încercați din nou mai târziu.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('sensitive'),
});

/**
 * Rate limiter pentru plasare comenzi
 * Previne abuzuri și spam comenzi
 */
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 oră
  max: 10, // Maximum 10 comenzi pe oră
  message: {
    error: 'Ați atins limita de comenzi. Încercați din nou mai târziu.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('order'),
  // Key generator bazat pe user ID sau IP
  keyGenerator: (req: Request) => {
    // Preferă user ID dacă e autentificat, altfel folosește IP
    const userId = (req as any).userId || '';
    return userId || req.ip || 'unknown';
  },
});

/**
 * Rate limiter pentru token refresh
 * Previne abuzuri ale sistemului de rotație
 */
export const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute
  max: 20, // 20 refresh-uri în 5 minute (suficient pentru tab-uri multiple)
  message: {
    error: 'Prea multe cereri de reînnoire sesiune.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('refresh'),
});

/**
 * Rate limiter pentru admin login
 * Mai strict decât cel normal
 */
export const adminAuthLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minute
  max: 5, // 5 încercări
  message: {
    error: 'Prea multe încercări de autentificare admin. Încercați din nou în 30 minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('admin-auth'),
  keyGenerator: (req: Request) => {
    const email = req.body?.email || '';
    return `admin-${req.ip}-${email}`;
  },
});
