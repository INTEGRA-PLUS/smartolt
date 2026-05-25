import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';

export async function registerHelmet(app: FastifyInstance): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
}
