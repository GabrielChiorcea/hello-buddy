/**
 * Controller autentificare admin
 * SECURITY: 
 * - Refresh token în HttpOnly cookie
 * - Token rotation la fiecare refresh
 * - Security logging pentru toate evenimentele
 */

import { Request, Response } from 'express';
import * as UserModel from '../../models/User.js';
import * as UserRoleModel from '../../models/UserRole.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeAllUserRefreshTokens,
  rotateRefreshToken,
} from '../../utils/jwt.js';
import { jwtConfig } from '../../config/jwt.js';
import {
  setAdminRefreshTokenCookie,
  clearAdminRefreshTokenCookie,
  getAdminRefreshTokenFromCookie,
} from '../../utils/cookies.js';
import {
  logAdminLoginSuccess,
  logAdminLoginFailed,
  logAdminAccessDenied,
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';
import { logError } from '../../utils/safeErrorLogger.js';

/**
 * POST /admin/auth/login
 * Autentificare admin - setează refresh token în HttpOnly cookie
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email și parolă obligatorii' });
      return;
    }
    
    // Verifică credențialele
    const user = await UserModel.verifyCredentials(email, password);
    if (!user) {
      logAdminLoginFailed(req, email, 'Invalid credentials');
      res.status(401).json({ error: 'Email sau parolă incorectă' });
      return;
    }
    
    // IMPORTANT: Verifică rolul admin din baza de date
    const isAdmin = await UserRoleModel.isAdmin(user.id);
    if (!isAdmin) {
      logAdminAccessDenied(req, user.id, email);
      res.status(403).json({ error: 'Acces interzis - cont admin necesar' });
      return;
    }
    
    // Generează token-uri
    const accessToken = generateAccessToken(user.id);
    const { token: refreshToken } = await generateRefreshToken(
      user.id,
      req.headers['user-agent'],
      req.ip
    );
    
    // Setează refresh token în HttpOnly cookie
    setAdminRefreshTokenCookie(res, refreshToken);
    
    // Log successful admin login
    logAdminLoginSuccess(req, user.id, user.email);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      expiresIn: jwtConfig.access.expiresIn,
    });
  } catch (error) {
    logError('autentificare admin', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * POST /admin/auth/refresh
 * Reîmprospătare token cu ROTAȚIE - citește din HttpOnly cookie
 * La fiecare refresh, vechiul token este revocat și unul nou este generat
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    // Citește refresh token din cookie
    const token = getAdminRefreshTokenFromCookie(req.cookies);
    
    if (!token) {
      res.status(401).json({ error: 'Sesiune expirată' });
      return;
    }
    
    // Verifică token-ul
    const payload = verifyRefreshToken(token);
    if (!payload) {
      clearAdminRefreshTokenCookie(res);
      res.status(401).json({ error: 'Token invalid' });
      return;
    }
    
    // Verifică dacă este încă admin
    const isAdmin = await UserRoleModel.isAdmin(payload.userId);
    if (!isAdmin) {
      logAdminAccessDenied(req, payload.userId);
      clearAdminRefreshTokenCookie(res);
      res.status(403).json({ error: 'Acces interzis' });
      return;
    }
    
    // Verifică dacă contul nu este blocat
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      clearAdminRefreshTokenCookie(res);
      res.status(401).json({ error: 'Utilizator negăsit' });
      return;
    }
    if (user.isBlocked) {
      clearAdminRefreshTokenCookie(res);
      res.status(403).json({ error: 'Contul este blocat' });
      return;
    }
    
    // TOKEN ROTATION: Rotează token-ul (revocă vechiul, generează nou)
    const rotationResult = await rotateRefreshToken(
      payload.tokenId,
      payload.userId,
      req.headers['user-agent'],
      req.ip,
      req
    );
    
    if (!rotationResult) {
      clearAdminRefreshTokenCookie(res);
      res.status(401).json({ error: 'Sesiune expirată sau compromisă' });
      return;
    }
    
    // Setează NOUL refresh token în cookie
    setAdminRefreshTokenCookie(res, rotationResult.refreshToken);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: rotationResult.accessToken,
      expiresIn: rotationResult.expiresIn,
    });
  } catch (error) {
    logError('refresh token admin', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * POST /admin/auth/logout
 * Deconectare admin - șterge cookie-ul și revocă token-urile
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const token = getAdminRefreshTokenFromCookie(req.cookies);
    
    if (token) {
      const payload = verifyRefreshToken(token);
      if (payload) {
        await revokeAllUserRefreshTokens(payload.userId);
        
        logSecurityEvent(SecurityEventType.LOGOUT, {
          req,
          userId: payload.userId,
          success: true,
        });
      }
    }
    
    clearAdminRefreshTokenCookie(res);
    res.json({ success: true });
  } catch (error) {
    logError('logout admin', error);
    clearAdminRefreshTokenCookie(res);
    res.json({ success: true });
  }
}
