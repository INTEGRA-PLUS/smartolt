import { FastifyRequest, FastifyReply } from 'fastify';
import { tenantService } from './tenant.service';
import { createTenantSchema, updateTenantSchema } from './tenant.schema';
import { ValidationError } from '../../shared/errors/AppError';

export async function listTenants(_req: FastifyRequest, reply: FastifyReply) {
  const tenants = await tenantService.findAll();
  return reply.send({ success: true, data: tenants, meta: { total: tenants.length } });
}

export async function getTenant(
  req: FastifyRequest<{ Params: { tenantId: string } }>,
  reply: FastifyReply,
) {
  const tenant = await tenantService.findById(req.params.tenantId);
  return reply.send({ success: true, data: tenant });
}

export async function createTenant(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = createTenantSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid tenant data', parsed.error.flatten());

  const tenant = await tenantService.create(parsed.data);
  return reply.status(201).send({ success: true, data: tenant });
}

export async function updateTenant(
  req: FastifyRequest<{ Params: { tenantId: string } }>,
  reply: FastifyReply,
) {
  const parsed = updateTenantSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid tenant data', parsed.error.flatten());

  const tenant = await tenantService.update(req.params.tenantId, parsed.data);
  return reply.send({ success: true, data: tenant });
}

export async function toggleTenantStatus(
  req: FastifyRequest<{ Params: { tenantId: string } }>,
  reply: FastifyReply,
) {
  const result = await tenantService.toggleStatus(req.params.tenantId);
  return reply.send({ success: true, data: result });
}

export async function deleteTenant(
  req: FastifyRequest<{ Params: { tenantId: string } }>,
  reply: FastifyReply,
) {
  await tenantService.delete(req.params.tenantId);
  return reply.status(204).send();
}

export async function getTenantStats(
  req: FastifyRequest<{ Params: { tenantId: string } }>,
  reply: FastifyReply,
) {
  const stats = await tenantService.getStats(req.params.tenantId);
  return reply.send({ success: true, data: stats });
}
