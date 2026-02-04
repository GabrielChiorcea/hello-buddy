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
      const accessToken = generateAccessToken(user.id, user.email);
      const { token: refreshToken } = await generateRefreshToken(
        user.id,
        context.req.headers['user-agent'],
        context.req.ip
      );
      
      // Setează refresh token în HttpOnly cookie
      setRefreshTokenCookie(context.res, refreshToken);
      
      // Log successful login
      logLoginSuccess(context.req, user.id, user.email);
      
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
      
      // Creează utilizatorul
      const user = await UserModel.create({ email, password, name, phone: normalizedPhone });
      
      // Generează token-uri
      const accessToken = generateAccessToken(user.id, user.email);
      const { token: refreshToken } = await generateRefreshToken(
        user.id,
        context.req.headers['user-agent'],
        context.req.ip
      );
      
      // Setează refresh token în HttpOnly cookie
      setRefreshTokenCookie(context.res, refreshToken);
      
      // Log signup
      logSignup(context.req, user.id, user.email);
      
      return {
        user,
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
      
      // Verifică parola curentă
      const user = await UserModel.verifyCredentials(context.user.email, currentPassword);
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
     */
    async requestPasswordReset(_: unknown, { email }: { email: string }) {
      const user = await UserModel.findByEmail(email);
      
      // Nu dezvăluim dacă email-ul există sau nu
      if (user) {
        // TODO: Implementare trimitere email cu link de resetare
        console.log(`Password reset requested for: ${email}`);
      }
      
      return true;
    },

    /**
     * Resetare parolă cu token
     */
    async resetPassword(
      _: unknown,
      { token, newPassword }: { token: string; newPassword: string }
    ) {
      // TODO: Implementare verificare token de resetare
      throw new Error('Funcționalitate în dezvoltare');
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
      
      // Verifică parola
      const user = await UserModel.verifyCredentials(context.user.email, password);
      if (!user) {
        throw new Error('Parola este incorectă');
      }
      
      const userId = context.user.id;
      const userEmail = context.user.email;
      
      // Șterge contul
      await UserModel.deleteUser(userId);
      
      // Șterge cookie-ul
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
