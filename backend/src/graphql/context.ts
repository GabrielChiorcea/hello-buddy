/**
 * Context GraphQL - extrage utilizatorul autentificat din token
 */

import { Request, Response } from 'express';
import { extractTokenFromHeader, verifyAccessToken } from '../utils/jwt.js';
import * as UserModel from '../models/User.js';
import { User } from '../models/User.js';

export interface GraphQLContext {
  user: User | null;
  req: Request;
  res: Response;
}

/**
 * Creează contextul pentru fiecare cerere GraphQL
 */
export async function createContext({ req, res }: { req: Request; res: Response }): Promise<GraphQLContext> {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return { user: null, req, res };
  }
  
  const payload = verifyAccessToken(token);
  if (!payload) {
    return { user: null, req, res };
  }
  
  const user = await UserModel.findById(payload.userId);
  
  return { user, req, res };
}

/**
 * Helper pentru a verifica autentificarea în rezolvere
 */
export function requireAuth(context: GraphQLContext): User {
  if (!context.user) {
    throw new Error('Autentificare necesară');
  }
  return context.user;
}
