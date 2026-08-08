import { Redis } from '@upstash/redis';
import { getEnv } from '../config/env';

let redisClient: Redis | null = null;
let isInitialized = false;

/**
 * Initializes and returns the Upstash Redis client instance.
 * Returns null if credentials are not configured or connection throws.
 */
export function getRedis(): Redis | null {
  if (isInitialized) return redisClient;

  const env = getEnv();
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      redisClient = new Redis({
        url,
        token,
      });
      console.log('🔌 Upstash Redis cache connection established.');
    } catch (err: any) {
      console.error('❌ Failed to construct Upstash Redis client:', err.message);
      redisClient = null;
    }
  } else {
    console.log('ℹ️ Upstash Redis is not configured. Cache bypass active.');
  }

  isInitialized = true;
  return redisClient;
}

/**
 * Retrieves a key value from Redis. Returns null on cache miss or connection failure.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const value = await client.get(key);
    if (value === null || value === undefined) return null;
    return value as T;
  } catch (err: any) {
    console.warn(`⚠️ Redis GET cache failure on key ${key}:`, err.message);
    return null;
  }
}

/**
 * Stores a value in Redis with an optional expiry TTL in seconds.
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch (err: any) {
    console.warn(`⚠️ Redis SET cache failure on key ${key}:`, err.message);
  }
}

/**
 * Deletes a key from Redis.
 */
export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(key);
  } catch (err: any) {
    console.warn(`⚠️ Redis DEL cache failure on key ${key}:`, err.message);
  }
}
