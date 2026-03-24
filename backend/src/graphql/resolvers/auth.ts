/**
 * Rezolvere pentru autentificare
 * SECURITY: 
 * - Refresh token în HttpOnly cookie
 * - Token rotation la fiecare refresh
 * - Security logging pentru toate evenimentele
 */

import { GraphQLContext } from '../context.js';
import * as UserModel from '../../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  revokeAllUserRefreshTokens,
} from '../../utils/jwt.js';
import { validatePasswordStrength } from '../../utils/password.js';
import { jwtConfig } from '../../config/jwt.js';
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../../utils/cookies.js';
import {
  logLoginSuccess,
  logLoginFailed,
  logSignup,
  logPasswordChanged,
  logAccountDeleted,
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';
import { sendPasswordResetEmail } from '../../utils/passwordResetEmail.js';
import { env } from '../../config/env.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';
import { queryOne } from '../../config/database.js';

// Rate limiting în memorie pentru signup și requestPasswordReset (per IP)
const signupRateLimits = new Map<string, { count: number; resetAt: number }>();
const passwordResetRateLimits = new Map<string, { count: number; resetAt: number }>();
const SIGNUP_LIMIT = 5;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000; // 1 oră
const PASSWORD_RESET_LIMIT = 5;
const PASSWORD_RESET_WINDOW_MS = 60 * 60 * 1000; // 1 oră

function checkSignupRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = signupRateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    signupRateLimits.set(ip, { count: 1, resetAt: now + SIGNUP_WINDOW_MS });
    return true;
  }
  if (entry.count >= SIGNUP_LIMIT) return false;
  entry.count++;
  return true;
}

function checkPasswordResetRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = passwordResetRateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    passwordResetRateLimits.set(ip, { count: 1, resetAt: now + PASSWORD_RESET_WINDOW_MS });
    return true;
  }
  if (entry.count >= PASSWORD_RESET_LIMIT) return false;
  entry.count++;
  return true;
}

interface LoginInput {
  email: string;
  password: string;
}

interface SignupInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export const authResolvers = {
  Mutation: {
    /**
     * Autentificare utilizator
     * Setează refresh token în HttpOnly cookie, returnează access token în body
     */
    async login(
      _: unknown,
      { input }: { input: LoginInput },
      context: GraphQLContext
    ) {
      const { email, password } = input;
      
      // Verifică credențialele
      const user = await UserModel.verifyCredentials(email, password);
      if (!user) {
        logLoginFailed(context.req, email, 'Invalid credentials');
        throw new Error('Email sau parolă incorectă');
      }
      
      // Generează token-uri
      const accessToken = generateAccessToken(user.id);
      const { token: refreshToken } = await generateRefreshToken(
        user.id,
        context.req.headers['user-agent'],
        context.req.ip
      );
      
      // Setează refresh token în HttpOnly cookie
      setRefreshTokenCookie(context.res, refreshToken);
      
      // Log successful login
        logLoginSuccess(context.req, user.id, user.email ?? '');
      
      return {
        user,
        accessToken,
        expiresIn: jwtConfig.access.expiresIn,
      };
    },

    /**
     * Înregistrare utilizator nou
     */
    async signup(
      _: unknown,
      { input }: { input: SignupInput },
      context: GraphQLContext
    ) {
      const ip = context.req.ip || context.req.socket?.remoteAddress || 'unknown';
      if (!checkSignupRateLimit(ip)) {
        throw new Error('Prea multe încercări de înregistrare. Încercați din nou în aproximativ o oră.');
      }

      const { email, password, name, phone } = input;
      const normalizedPhone = phone?.trim() || undefined;
      
      // Verifică dacă email-ul există deja
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        throw new Error('Acest email este deja înregistrat');
      }

      // Verifică dacă telefonul există deja (dacă a fost furnizat)
      if (normalizedPhone) {
        const existingByPhone = await UserModel.findByPhone(normalizedPhone);
        if (existingByPhone) {
          throw new Error('Acest număr de telefon este deja folosit');
        }
      }
      
      // Validează parola
      const passwordErrors = validatePasswordStrength(password);
      if (passwordErrors.length > 0) {
        throw new Error(passwordErrors.join('. '));
      }
      
      // Creează utilizatorul (în create() se setează și rank-ul de început Newbe)
      const user = await UserModel.create({ email, password, name, phone: normalizedPhone });
      
      // Cadou puncte la înregistrare (dacă plugin welcome_bonus și puncte sunt active)
      let userToReturn = user;
      const welcomeBonusEnabled = await isPluginEnabled('welcome_bonus');
      const pointsEnabled = await isPluginEnabled('points');
      if (welcomeBonusEnabled && pointsEnabled) {
        const bonusRow = await queryOne<{ value: string }>(
          "SELECT value FROM app_settings WHERE id = 'points_welcome_bonus'"
        );
        const amount = bonusRow ? Math.max(0, parseInt(bonusRow.value, 10) || 0) : 5;
        if (amount > 0) {
          const { addPoints } = await import('../../plugins/points/repositories/transactionsRepository.js');
          await addPoints(user.id, amount, null, 'earned');
          userToReturn = (await UserModel.findById(user.id)) ?? user;
        }
      }
      
      // Generează token-uri
      const accessToken = generateAccessToken(userToReturn.id);
      const { token: refreshToken } = await generateRefreshToken(
        userToReturn.id,
        context.req.headers['user-agent'],
        context.req.ip
      );
      
      // Setează refresh token în HttpOnly cookie
      setRefreshTokenCookie(context.res, refreshToken);
      
      // Log signup
      logSignup(context.req, userToReturn.id, userToReturn.email ?? '');
      
      return {
        user: userToReturn,
        accessToken,
        expiresIn: jwtConfig.access.expiresIn,
      };
    },

    /**
     * Deconectare - revocă token-ul și șterge cookie-ul
     */
    async logout(_: unknown, __: unknown, context: GraphQLContext) {
      if (context.user) {
        // Revocă toate token-urile de refresh ale utilizatorului
        await revokeAllUserRefreshTokens(context.user.id);
        
        logSecurityEvent(SecurityEventType.LOGOUT, {
          req: context.req,
          userId: context.user.id,
          success: true,
        });
      }
      
      // Șterge cookie-ul cu refresh token
      clearRefreshTokenCookie(context.res);
      
      return true;
    },

    /**
     * Schimbare parolă
     */
    async changePassword(
      _: unknown,
      { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
      context: GraphQLContext
    ) {
      if (!context.user) {
        throw new Error('Autentificare necesară');
      }

      const sessionEmail = context.user.email;
      if (!sessionEmail) {
        throw new Error('Autentificare necesară');
      }

      // Verifică parola curentă
      const user = await UserModel.verifyCredentials(sessionEmail, currentPassword);
      if (!user) {
        throw new Error('Parola curentă este incorectă');
      }
      
      // Validează noua parolă
      const passwordErrors = validatePasswordStrength(newPassword);
      if (passwordErrors.length > 0) {
        throw new Error(passwordErrors.join('. '));
      }
      
      // Schimbă parola
      await UserModel.changePassword(context.user.id, newPassword);
      
      // Revocă toate token-urile de refresh
      await revokeAllUserRefreshTokens(context.user.id);
      
      // Șterge cookie-ul curent
      clearRefreshTokenCookie(context.res);
      
      // Log password change
      logPasswordChanged(context.req, context.user.id);
      
      return true;
    },

    /**
     * Cerere resetare parolă
     * Returnează mereu true pentru a nu dezvălui dacă email-ul există.
     */
    async requestPasswordReset(_: unknown, { email }: { email: string }, context: GraphQLContext) {
      const ip = context.req.ip || context.req.socket?.remoteAddress || 'unknown';
      if (!checkPasswordResetRateLimit(ip)) {
        throw new Error('Prea multe cereri de resetare parolă. Încercați din nou în aproximativ o oră.');
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await UserModel.findByEmail(normalizedEmail);

      if (user) {
        const token = await UserModel.createPasswordResetToken(user.id);
        if (token) {
          const resetLink = `${env.FRONTEND_URL}/reset-password/${token}`;
          sendPasswordResetEmail(normalizedEmail, resetLink, 1);
        }
      }

      return true;
    },

    /**
     * Resetare parolă cu token (one-time use)
     */
    async resetPassword(
      _: unknown,
      { token, newPassword }: { token: string; newPassword: string }
    ) {
      const userId = await UserModel.findUserIdByPasswordResetToken(token);
      if (!userId) {
        throw new Error('Link-ul de resetare este invalid sau a expirat. Solicită unul nou.');
      }

      const activeUser = await UserModel.findById(userId);
      if (!activeUser) {
        throw new Error('Acest cont nu mai este disponibil.');
      }

      const passwordErrors = validatePasswordStrength(newPassword);
      if (passwordErrors.length > 0) {
        throw new Error(passwordErrors.join('. '));
      }

      await UserModel.changePassword(userId, newPassword);
      await UserModel.deletePasswordResetToken(token);

      return true;
    },

    /**
     * Ștergere cont
     */
    async deleteAccount(
      _: unknown,
      { password, confirmText }: { password: string; confirmText: string },
      context: GraphQLContext
    ) {
      if (!context.user) {
        throw new Error('Autentificare necesară');
      }
      
      // Verifică textul de confirmare
      if (confirmText !== 'ȘTERGE CONTUL') {
        throw new Error('Textul de confirmare este incorect');
      }
      
      const sessionEmail = context.user.email;
      if (!sessionEmail) {
        throw new Error('Autentificare necesară');
      }

      // Verifică parola
      const user = await UserModel.verifyCredentials(sessionEmail, password);
      if (!user) {
        throw new Error('Parola este incorectă');
      }
      
      const userId = context.user.id;
      const userEmail = sessionEmail;

      await revokeAllUserRefreshTokens(userId);
      await UserModel.softDeleteAnonymizeUser(userId);

      clearRefreshTokenCookie(context.res);
      
      // Log account deletion
      logAccountDeleted(context.req, userId, userEmail);
      
      return true;
    },
  },

  Query: {
    /**
     * Obține utilizatorul curent (bazat pe access token din header)
     */
    async currentUser(_: unknown, __: unknown, context: GraphQLContext) {
      return context.user;
    },
  },
};
