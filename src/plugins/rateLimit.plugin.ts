import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { getRedisClient } from '../infrastructure/redis/redis';
import { env } from '../config/env';

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    redis: getRedisClient(),
    keyGenerator(request) {
      const user = request.user as { tenantId?: string } | undefined;
      const tenantId = user?.tenantId ?? 'anonymous';
      return `rl:${tenantId}:${request.routerPath}`;
    },
    errorResponseBuilder(_request, context) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
        },
        retryAfter: context.ttl,
      };
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });
}
