import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service';
import { loginSchema, createApiKeySchema } from './auth.schema';
import { ValidationError } from '../../shared/errors/AppError';

export async function login(req: FastifyRequest, reply: FastifyReply) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid credentials format', parsed.error.flatten());

  const result = await authService.login(parsed.data);
  return reply.send({ success: true, data: result });
}

export async function me(req: FastifyRequest, reply: FastifyReply) {
  return reply.send({ success: true, data: req.user });
}

export async function createApiKey(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createApiKeySchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid API key data', parsed.error.flatten());

  const jwtPayload = req.user as { tenantId: string };
  const result = await authService.createApiKey(jwtPayload.tenantId, parsed.data);
  return reply.status(201).send({ success: true, data: result });
}
