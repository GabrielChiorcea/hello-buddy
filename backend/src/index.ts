/**
 * Entry point principal - Server Express + Apollo GraphQL
 * SECURITY: 
 * - Cookie parser pentru HttpOnly refresh tokens
 * - Token rotation la refresh
 * - Rate limiting pe comenzi
 * - Security logging
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { env, isDevelopment } from './config/env.js';
import { testConnection } from './config/database.js';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers/index.js';
import { createContext } from './graphql/context.js';
import { apiLimiter, authLimiter, refreshLimiter, orderLimiter } from './middleware/rateLimiter.js';
import adminRouter from './admin/router.js';
import {
  verifyRefreshToken,
  rotateRefreshToken,
} from './utils/jwt.js';
import {
  getRefreshTokenFromCookie,
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from './utils/cookies.js';
import * as UserModel from './models/User.js';
import { jwtConfig } from './config/jwt.js';
import { logTokenInvalid, logSecurityEvent, SecurityEventType } from './utils/securityLogger.js';

async function startServer() {
  // Testează conexiunea la DB
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Nu se poate porni serverul fără conexiune la baza de date');
    process.exit(1);
  }

  const app = express();

  // Middleware de securitate
  app.use(helmet({ contentSecurityPolicy: isDevelopment ? false : undefined }));
  app.use(cors({
    origin: [env.FRONTEND_URL, env.ADMIN_URL],
    credentials: true, // IMPORTANT: permite cookies
  }));
  app.use(cookieParser()); // Parser pentru cookies
  app.use(express.json({ limit: '50mb' })); // Mărit pentru upload imagini

  // Servește fișierele statice din storage
  app.use('/storage', express.static('storage'));

  // Rate limiting
  app.use('/api/', apiLimiter);
  app.use('/api/auth/', authLimiter);
  app.use('/api/auth/refresh', refreshLimiter);

  // Inițializare Apollo Server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await apolloServer.start();

  // GraphQL endpoint - include res în context pentru setarea cookie-urilor
  app.use('/graphql', expressMiddleware(apolloServer, {
    context: async ({ req, res }) => createContext({ req, res }),
  }));

  // Admin API
  app.use('/admin', adminRouter);

  // ============================================
  // REST endpoint pentru refresh token cu TOKEN ROTATION
  // ============================================
  app.post('/api/auth/refresh', async (req, res) => {
    try {
      // Citește refresh token din HttpOnly cookie
      const refreshToken = getRefreshTokenFromCookie(req.cookies);
      
      if (!refreshToken) {
        return res.status(401).json({ error: 'Sesiune expirată' });
      }
      
      // Verifică token-ul
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        logTokenInvalid(req, 'Invalid JWT signature');
        clearRefreshTokenCookie(res);
        return res.status(401).json({ error: 'Token invalid' });
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
        clearRefreshTokenCookie(res);
        return res.status(401).json({ error: 'Sesiune expirată sau compromisă' });
      }
      
      // Obține utilizatorul pentru răspuns
      const user = await UserModel.findById(payload.userId);
      if (!user) {
        clearRefreshTokenCookie(res);
        return res.status(401).json({ error: 'Utilizator negăsit' });
      }
      
      // Setează NOUL refresh token în cookie
      setRefreshTokenCookie(res, rotationResult.refreshToken);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
        },
        accessToken: rotationResult.accessToken,
        expiresIn: rotationResult.expiresIn,
      });
    } catch (error) {
      console.error('Eroare refresh token:', error);
      clearRefreshTokenCookie(res);
      res.status(500).json({ error: 'Eroare internă server' });
    }
  });

  // Health check
  app.get('/health', (_, res) => res.json({ status: 'ok' }));

  // Pornire server
  app.listen(env.PORT, () => {
    console.log(`🚀 Server pornit pe http://localhost:${env.PORT}`);
    console.log(`📊 GraphQL: http://localhost:${env.PORT}/graphql`);
    console.log(`🔐 Admin API: http://localhost:${env.PORT}/admin`);
    console.log(`🛡️  Security features: HttpOnly cookies, Token rotation, Rate limiting`);
  });
}

startServer().catch(console.error);
