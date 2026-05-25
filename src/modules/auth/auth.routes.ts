import { FastifyInstance } from 'fastify';
import { login, me, createApiKey } from './auth.controller';

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', { schema: { tags: ['Auth'], summary: 'Login and get JWT token' } }, login);

  app.get(
    '/me',
    { onRequest: [app.authenticate], schema: { tags: ['Auth'], summary: 'Get current user info' } },
    me,
  );

  app.post(
    '/api-keys',
    {
      onRequest: [app.authenticate],
      schema: { tags: ['Auth'], summary: 'Create a new API key' },
    },
    createApiKey,
  );
}
