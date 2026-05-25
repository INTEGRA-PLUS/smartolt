import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env';
import { resolveTenant } from '../middleware/tenant.middleware';
import { UnauthorizedError } from '../shared/errors/AppError';

export async function registerAuth(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  app.decorate('authenticate', async function (request: Parameters<typeof resolveTenant>[0], reply: Parameters<typeof resolveTenant>[1]) {
    try {
      await request.jwtVerify();
      await resolveTenant(request, reply);
    } catch (err) {
      if (err instanceof UnauthorizedError || err instanceof Error && err.message.includes('Tenant')) {
        throw err;
      }
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
}
