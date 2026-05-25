import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../infrastructure/database/prisma';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/AppError';
import type { JwtPayload } from '../shared/types/fastify.types';

export async function resolveTenant(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const payload = req.user as JwtPayload | undefined;
  if (!payload?.tenantId) {
    throw new UnauthorizedError('No tenant context in token');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
  });

  if (!tenant) {
    throw new ForbiddenError('Tenant not found');
  }

  if (!tenant.isActive) {
    throw new ForbiddenError('Tenant account is suspended');
  }

  req.tenant = {
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    xToken: tenant.xToken,
    status: tenant.status,
    cacheRules: (tenant.cacheRules as Record<string, number>) ?? {},
    rateLimits: {
      requestsPerMinute: tenant.rateLimitPerMinute,
      burstSize: tenant.rateLimitBurst,
    },
  };
}
