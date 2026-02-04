/**
 * Middleware pentru verificare autentificare JWT
 */

import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyAccessToken } from '../utils/jwt.js';
import * as UserModel from '../models/User.js';
import { User } from '../models/User.js';

// Extinde tipul Request pentru a include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware care extrage utilizatorul din token (opțional)
 */
export async function extractUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      const user = await UserModel.findById(payload.userId);
      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
  }
  
  next();
}

/**
 * Middleware care necesită autentificare
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    res.status(401).json({ error: 'Token de autentificare lipsă' });
    return;
  }
  
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token invalid sau expirat' });
    return;
  }
  
  const user = await UserModel.findById(payload.userId);
  if (!user) {
    res.status(401).json({ error: 'Utilizator negăsit' });
    return;
  }
  
  if (user.isBlocked) {
    res.status(403).json({ error: 'Contul este blocat' });
    return;
  }
  
  req.user = user;
  next();
}
