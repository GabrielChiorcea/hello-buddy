/**
 * Cache scurt pentru răspunsul GET /admin/analytics (memorie + Redis opțional)
 */

import { env } from '../config/env.js';
import { getRedisClient } from '../config/redis.js';

const memory = new Map<string, { body: string; expiresAt: number }>();

function redisKey(cacheKey: string): string {
  return `analytics:main:${cacheKey}`;
}

export async function getAnalyticsCacheJson(cacheKey: string): Promise<unknown | null> {
  if (env.ANALYTICS_CACHE_TTL_SECONDS <= 0) return null;

  const redis = getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get(redisKey(cacheKey));
      if (raw) return JSON.parse(raw) as unknown;
    } catch {
      /* fallback memorie */
    }
  }

  const hit = memory.get(cacheKey);
  if (!hit || Date.now() > hit.expiresAt) {
    memory.delete(cacheKey);
    return null;
  }
  try {
    return JSON.parse(hit.body) as unknown;
  } catch {
    memory.delete(cacheKey);
    return null;
  }
}

export async function setAnalyticsCacheJson(cacheKey: string, payload: unknown): Promise<void> {
  if (env.ANALYTICS_CACHE_TTL_SECONDS <= 0) return;

  const ttl = env.ANALYTICS_CACHE_TTL_SECONDS;
  const serialized = JSON.stringify(payload);

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(redisKey(cacheKey), serialized, { EX: ttl });
    } catch {
      /* memorie */
    }
  }

  memory.set(cacheKey, {
    body: serialized,
    expiresAt: Date.now() + ttl * 1000,
  });
}
