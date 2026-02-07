/**
 * Configurare Redis pentru rate limiting persistent
 * Dacă REDIS_URL nu este setat, rate limiterul folosește store în memorie
 */

import { createClient } from 'redis';
import { env } from './env.js';

let redisClient: ReturnType<typeof createClient> | null = null;
let connectionAttempted = false;
let connectionSucceeded = false;

/**
 * Returnează clientul Redis doar dacă e conectat (apelat după connectRedis).
 */
export function getRedisClient(): ReturnType<typeof createClient> | null {
  if (!env.REDIS_URL) return null;
  if (!connectionSucceeded || !redisClient) return null;
  return redisClient;
}

/**
 * Conectează la Redis. Trebuie apelat înainte de pornirea serverului.
 */
export async function connectRedis(): Promise<boolean> {
  if (!env.REDIS_URL) return false;
  if (connectionAttempted) return connectionSucceeded;
  connectionAttempted = true;
  try {
    redisClient = createClient({ url: env.REDIS_URL });
    redisClient.on('error', (err) => console.warn('[Redis]', err.message));
    await redisClient.connect();
    connectionSucceeded = true;
    console.log('✅ Redis conectat pentru rate limiting');
    return true;
  } catch (err) {
    console.warn('⚠️ Redis indisponibil, rate limiting folosește memorie:', (err as Error).message);
    redisClient = null;
    return false;
  }
}
