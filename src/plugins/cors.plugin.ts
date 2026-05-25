import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { env } from '../config/env';

export async function registerCors(app: FastifyInstance): Promise<void> {
  const origins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

  await app.register(cors, {
    origin: env.NODE_ENV === 'development' ? true : origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials: true,
    maxAge: 86400,
  });
}
