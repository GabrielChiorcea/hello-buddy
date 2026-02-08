/**
 * =============================================================================
 * SECURITY LOGGER - Logging pentru evenimente de securitate
 * =============================================================================
 * 
 * Loghează toate evenimentele relevante pentru securitate:
 * - Autentificări reușite/eșuate
 * - Token refresh și rotație
 * - Comenzi plasate
 * - Încercări de acces neautorizat
 * - Rate limiting declanșat
 */

import { Request } from 'express';
import { securityLogger as winstonSecurityLogger } from '../config/logger.js';

export enum SecurityEventType {
  // Autentificare
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  SIGNUP_SUCCESS = 'SIGNUP_SUCCESS',
  LOGOUT = 'LOGOUT',
  
  // Token management
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_ROTATION = 'TOKEN_ROTATION',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Admin
  ADMIN_LOGIN_SUCCESS = 'ADMIN_LOGIN_SUCCESS',
  ADMIN_LOGIN_FAILED = 'ADMIN_LOGIN_FAILED',
  ADMIN_ACCESS_DENIED = 'ADMIN_ACCESS_DENIED',
  
  // Comenzi
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_RATE_LIMITED = 'ORDER_RATE_LIMITED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AUTH_RATE_LIMIT_EXCEEDED = 'AUTH_RATE_LIMIT_EXCEEDED',
  
  // Acces
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
}

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: Date;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  success: boolean;
}

/**
 * Extrage informații din request
 */
function extractRequestInfo(req?: Request): { ip: string; userAgent: string } {
  return {
    ip: req?.ip || req?.headers['x-forwarded-for']?.toString() || 'unknown',
    userAgent: req?.headers['user-agent'] || 'unknown',
  };
}

/**
 * Formatează evenimentul pentru logging
 */
function formatEvent(event: SecurityEvent): string {
  const level = event.success ? 'INFO' : 'WARN';
  const emoji = event.success ? '✅' : '⚠️';
  
  let message = `[${level}] ${emoji} ${event.type}`;
  
  if (event.userId) message += ` | User: ${event.userId}`;
  if (event.email) message += ` | Email: ${event.email}`;
  message += ` | IP: ${event.ip}`;
  
  if (event.details && Object.keys(event.details).length > 0) {
    message += ` | Details: ${JSON.stringify(event.details)}`;
  }
  
  return message;
}

/**
 * Loghează un eveniment de securitate
 */
export function logSecurityEvent(
  type: SecurityEventType,
  options: {
    req?: Request;
    userId?: string;
    email?: string;
    success?: boolean;
    details?: Record<string, unknown>;
  } = {}
): void {
  const { req, userId, email, success = true, details } = options;
  const { ip, userAgent } = extractRequestInfo(req);
  
  const event: SecurityEvent = {
    type,
    timestamp: new Date(),
    userId,
    email,
    ip,
    userAgent,
    details,
    success,
  };
  
  const formattedMessage = `[SECURITY] ${formatEvent(event)}`;

  if (success) {
    winstonSecurityLogger.info(formattedMessage, { type, userId, email, ip, userAgent, details });
  } else {
    winstonSecurityLogger.warn(formattedMessage, { type, userId, email, ip, userAgent, details });
  }
}

/**
 * Loghează autentificare reușită
 */
export function logLoginSuccess(req: Request, userId: string, email: string): void {
  logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, {
    req,
    userId,
    email,
    success: true,
  });
}

/**
 * Loghează autentificare eșuată
 */
export function logLoginFailed(req: Request, email: string, reason?: string): void {
  logSecurityEvent(SecurityEventType.LOGIN_FAILED, {
    req,
    email,
    success: false,
    details: { reason: reason || 'Invalid credentials' },
  });
}

/**
 * Loghează înregistrare
 */
export function logSignup(req: Request, userId: string, email: string): void {
  logSecurityEvent(SecurityEventType.SIGNUP_SUCCESS, {
    req,
    userId,
    email,
    success: true,
  });
}

/**
 * Loghează token refresh cu rotație
 */
export function logTokenRotation(req: Request, userId: string, oldTokenId: string, newTokenId: string): void {
  logSecurityEvent(SecurityEventType.TOKEN_ROTATION, {
    req,
    userId,
    success: true,
    details: { oldTokenId, newTokenId },
  });
}

/**
 * Loghează token invalid
 */
export function logTokenInvalid(req: Request, reason: string): void {
  logSecurityEvent(SecurityEventType.TOKEN_INVALID, {
    req,
    success: false,
    details: { reason },
  });
}

/**
 * Loghează comandă plasată
 */
export function logOrderPlaced(req: Request, userId: string, orderId: string, total: number): void {
  logSecurityEvent(SecurityEventType.ORDER_PLACED, {
    req,
    userId,
    success: true,
    details: { orderId, total },
  });
}

/**
 * Loghează rate limiting pentru comenzi
 */
export function logOrderRateLimited(req: Request, userId?: string): void {
  logSecurityEvent(SecurityEventType.ORDER_RATE_LIMITED, {
    req,
    userId,
    success: false,
    details: { message: 'Too many order attempts' },
  });
}

/**
 * Loghează acces admin reușit
 */
export function logAdminLoginSuccess(req: Request, userId: string, email: string): void {
  logSecurityEvent(SecurityEventType.ADMIN_LOGIN_SUCCESS, {
    req,
    userId,
    email,
    success: true,
  });
}

/**
 * Loghează încercare de acces admin eșuată
 */
export function logAdminLoginFailed(req: Request, email: string, reason: string): void {
  logSecurityEvent(SecurityEventType.ADMIN_LOGIN_FAILED, {
    req,
    email,
    success: false,
    details: { reason },
  });
}

/**
 * Loghează acces admin interzis
 */
export function logAdminAccessDenied(req: Request, userId?: string, email?: string): void {
  logSecurityEvent(SecurityEventType.ADMIN_ACCESS_DENIED, {
    req,
    userId,
    email,
    success: false,
    details: { message: 'User is not an admin' },
  });
}

/**
 * Loghează rate limiting general
 */
export function logRateLimitExceeded(req: Request, endpoint: string): void {
  logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, {
    req,
    success: false,
    details: { endpoint },
  });
}

/**
 * Loghează schimbare parolă
 */
export function logPasswordChanged(req: Request, userId: string): void {
  logSecurityEvent(SecurityEventType.PASSWORD_CHANGED, {
    req,
    userId,
    success: true,
  });
}

/**
 * Loghează ștergere cont
 */
export function logAccountDeleted(req: Request, userId: string, email: string): void {
  logSecurityEvent(SecurityEventType.ACCOUNT_DELETED, {
    req,
    userId,
    email,
    success: true,
  });
}
