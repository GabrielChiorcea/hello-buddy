/**
 * Middleware pentru verificare rol admin
 * IMPORTANT: Verifică rolul din baza de date, nu din token
 */

import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyAccessToken } from '../utils/jwt.js';
import * as UserModel from '../models/User.js';
import * as UserRoleModel from '../models/UserRole.js';

/**
 * Middleware care necesită rol de admin
 * Verifică rolul din tabela user_roles, NU din token
 */
export async function requireAdmin(
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
  
  // Verifică dacă utilizatorul există și nu este blocat
  const user = await UserModel.findById(payload.userId);
  if (!user) {
    res.status(401).json({ error: 'Utilizator negăsit' });
    return;
  }
  
  if (user.isBlocked) {
    res.status(403).json({ error: 'Contul este blocat' });
    return;
  }
  
  // IMPORTANT: Verifică rolul din baza de date
  const isAdmin = await UserRoleModel.isAdmin(payload.userId);
  if (!isAdmin) {
    res.status(403).json({ error: 'Acces interzis - rol admin necesar' });
    return;
  }
  
  req.user = user;
  next();
}

/**
 * Middleware care necesită rol de moderator sau admin
 */
export async function requireModerator(
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
  
  // Verifică dacă are rol admin sau moderator
  const isAdmin = await UserRoleModel.hasRole(payload.userId, 'admin');
  const isModerator = await UserRoleModel.hasRole(payload.userId, 'moderator');
  
  if (!isAdmin && !isModerator) {
    res.status(403).json({ error: 'Acces interzis - rol moderator sau admin necesar' });
    return;
  }
  
  req.user = user;
  next();
}
