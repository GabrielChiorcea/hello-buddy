/**
 * Configurare și validare variabile de mediu
 * Acest fișier validează toate variabilele necesare la pornirea aplicației
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Încarcă variabilele din .env.<mediu>
const runtimeEnv =
  process.env.NODE_ENV === 'production'
    ? 'production'
    : process.env.NODE_ENV === 'test'
      ? 'test'
      : 'development';
dotenv.config({ path: `.env.${runtimeEnv}` });

/** Origine fără path / slash final — aliniere cu header-ul `Origin` din browser pentru CORS */
function normalizeOriginUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}

// Schema de validare pentru variabilele de mediu
const envSchema = z.object({
  // Baza de date
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('3306').transform(Number),
  DB_USER: z.string().min(1, 'DB_USER este obligatoriu'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD este obligatoriu'),
  DB_NAME: z.string().default('food_ordering'),
  /** Opțional: replica read-only pentru rapoarte analitice (aceiași user/parolă/DB, alt host) */
  DB_READ_HOST: z.string().optional(),
  DB_READ_PORT: z.string().optional().transform((v) => (v ? Number(v) : undefined)),

  // Analitice admin
  ANALYTICS_MAX_PERIOD_DAYS: z.string().default('90').transform(Number),
  ANALYTICS_REQUEST_TIMEOUT_MS: z.string().default('25000').transform(Number),
  /** 0 = cache dezactivat */
  ANALYTICS_CACHE_TTL_SECONDS: z.string().default('90').transform(Number),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET trebuie să aibă minim 32 caractere'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET trebuie să aibă minim 32 caractere'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('3600').transform(Number),
  JWT_REFRESH_EXPIRES_IN: z.string().default('604800').transform(Number),
  
  // Server
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173').transform(normalizeOriginUrl),
  /** Optional: URL frontend pe rețea (ex: http://192.168.1.146:8080) pentru acces de pe telefon – folosit la CORS */
  FRONTEND_URL_NETWORK: z
    .string()
    .url()
    .optional()
    .transform((v) => (v === undefined ? undefined : normalizeOriginUrl(v))),
  /** Opțional: origini extra pentru CORS, separate prin virgulă (ex. https://www.site.ro când FRONTEND_URL e fără www) */
  CORS_EXTRA_ORIGINS: z
    .string()
    .optional()
    .transform((s) =>
      s
        ? s
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
            .map((url) => normalizeOriginUrl(url))
        : []
    ),
  ADMIN_URL: z.string().url().default('http://localhost:5174').transform(normalizeOriginUrl),
  
  // Upload
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('5242880').transform(Number),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // Redis (opțional - pentru rate limiting persistent)
  REDIS_URL: z.string().optional(),

  // Logging
  LOG_DIR: z.string().default('./logs'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_TO_CONSOLE: z.string().default('true').transform((v) => v === 'true' || v === '1'),
});

// Validează și exportă configurația
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Eroare configurare variabile de mediu:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

// Helper pentru a verifica dacă suntem în producție
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
