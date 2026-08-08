import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().optional().or(z.literal('')),
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1, 'TELEGRAM_WEBHOOK_SECRET is required'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  CRON_SECRET: z.string().min(1, 'CRON_SECRET is required'),
  MIN_LIQUIDITY_USD: z.coerce.number().default(5000),
  MAX_SCAN_CANDIDATES: z.coerce.number().default(150),
  MANUAL_SCAN_COOLDOWN_SECONDS: z.coerce.number().default(120),
  GROQ_API_KEY: z.string().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal('')),
  GROK_API_KEY: z.string().optional().or(z.literal('')),
});

export type Env = z.infer<typeof envSchema>;

let envCache: Env | null = null;

export function getEnv(): Env {
  if (envCache) return envCache;

  const result = envSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    MIN_LIQUIDITY_USD: process.env.MIN_LIQUIDITY_USD,
    MAX_SCAN_CANDIDATES: process.env.MAX_SCAN_CANDIDATES,
    MANUAL_SCAN_COOLDOWN_SECONDS: process.env.MANUAL_SCAN_COOLDOWN_SECONDS,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    GROK_API_KEY: process.env.GROK_API_KEY,
  });

  if (!result.success) {
    return {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
      NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '',
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
      TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET || '',
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      CRON_SECRET: process.env.CRON_SECRET || '',
      MIN_LIQUIDITY_USD: Number(process.env.MIN_LIQUIDITY_USD) || 5000,
      MAX_SCAN_CANDIDATES: Number(process.env.MAX_SCAN_CANDIDATES) || 150,
      MANUAL_SCAN_COOLDOWN_SECONDS: Number(process.env.MANUAL_SCAN_COOLDOWN_SECONDS) || 120,
      GROQ_API_KEY: process.env.GROQ_API_KEY || '',
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
      GROK_API_KEY: process.env.GROK_API_KEY || '',
    };
  }

  envCache = result.data;
  return envCache;
}

export function validateEnv(): Env {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    MIN_LIQUIDITY_USD: process.env.MIN_LIQUIDITY_USD,
    MAX_SCAN_CANDIDATES: process.env.MAX_SCAN_CANDIDATES,
    MANUAL_SCAN_COOLDOWN_SECONDS: process.env.MANUAL_SCAN_COOLDOWN_SECONDS,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    GROK_API_KEY: process.env.GROK_API_KEY,
  });

  if (!result.success) {
    const errorDetails = JSON.stringify(result.error.format());
    console.error('❌ Environment validation failed:', errorDetails);
    throw new Error(`Environment validation failed: ${errorDetails}`);
  }

  return result.data;
}
