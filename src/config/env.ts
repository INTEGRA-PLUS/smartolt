import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_HOST: z.string().default('0.0.0.0'),
  APP_PORT: z.coerce.number().default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  API_KEY_SALT: z.string().min(16),

  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),

  DATABASE_URL: z.string().url(),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_KEY_PREFIX: z.string().default('smartolt:'),

  SMARTOLT_BASE_URL: z.string().default('https://{subdomain}.smartolt.com/api'),
  SMARTOLT_TIMEOUT: z.coerce.number().default(30000),
  SMARTOLT_RETRY_ATTEMPTS: z.coerce.number().default(3),
  SMARTOLT_RETRY_DELAY: z.coerce.number().default(1000),
  SMARTOLT_CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().default(5),
  SMARTOLT_CIRCUIT_BREAKER_TIMEOUT: z.coerce.number().default(60000),

  CACHE_TTL_OLTS: z.coerce.number().default(600),
  CACHE_TTL_ONUS: z.coerce.number().default(300),
  CACHE_TTL_SIGNAL_LEVELS: z.coerce.number().default(900),
  CACHE_TTL_ONU_STATUS: z.coerce.number().default(300),
  CACHE_TTL_ONU_TYPES: z.coerce.number().default(86400),
  CACHE_TTL_DEFAULT: z.coerce.number().default(300),

  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000),

  QUEUE_CONCURRENCY: z.coerce.number().default(5),
  QUEUE_MAX_ATTEMPTS: z.coerce.number().default(3),
  QUEUE_BACKOFF_DELAY: z.coerce.number().default(2000),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  SWAGGER_ENABLED: z.coerce.boolean().default(true),
  SWAGGER_HOST: z.string().default('localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
