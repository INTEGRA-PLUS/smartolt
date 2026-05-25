import { FastifyRequest, FastifyReply } from 'fastify';
import { onuService } from './onu.service';
import {
  rebootONUSchema,
  authorizeONUSchema,
  moveONUSchema,
  enableDisableONUSchema,
  deleteONUSchema,
} from './onu.schema';
import { ValidationError } from '../../shared/errors/AppError';

export async function getONUs(
  req: FastifyRequest<{ Querystring: { olt_id?: string } }>,
  reply: FastifyReply,
) {
  const { data, fromCache } = await onuService.getONUs(req.tenant!, req.query.olt_id);
  return reply.send({ success: true, data, meta: { total: data.length, source: fromCache ? 'cache' : 'upstream' } });
}

export async function getONUDetail(
  req: FastifyRequest<{ Params: { sn: string } }>,
  reply: FastifyReply,
) {
  const { data, fromCache } = await onuService.getONUDetail(req.tenant!, req.params.sn);
  return reply.send({ success: true, data, meta: { source: fromCache ? 'cache' : 'upstream' } });
}

export async function getONUStatus(
  req: FastifyRequest<{ Params: { sn: string } }>,
  reply: FastifyReply,
) {
  const { data, fromCache } = await onuService.getONUStatus(req.tenant!, req.params.sn);
  return reply.send({ success: true, data, meta: { source: fromCache ? 'cache' : 'upstream' } });
}

export async function getSignalLevels(
  req: FastifyRequest<{ Querystring: { sn?: string } }>,
  reply: FastifyReply,
) {
  const { data, fromCache } = await onuService.getSignalLevels(req.tenant!, req.query.sn);
  return reply.send({ success: true, data, meta: { source: fromCache ? 'cache' : 'upstream' } });
}

export async function getONUTypes(req: FastifyRequest, reply: FastifyReply) {
  const { data, fromCache } = await onuService.getONUTypes(req.tenant!);
  return reply.send({ success: true, data, meta: { total: data.length, source: fromCache ? 'cache' : 'upstream' } });
}

export async function getUnauthorizedONUs(req: FastifyRequest, reply: FastifyReply) {
  const { data, fromCache } = await onuService.getUnauthorizedONUs(req.tenant!);
  return reply.send({ success: true, data, meta: { total: data.length, source: fromCache ? 'cache' : 'upstream' } });
}

export async function rebootONU(req: FastifyRequest, reply: FastifyReply) {
  const parsed = rebootONUSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid reboot payload', parsed.error.flatten());

  const result = await onuService.rebootONU(req.tenant!, parsed.data, req.id);
  return reply.status(202).send({ success: true, data: result });
}

export async function authorizeONU(req: FastifyRequest, reply: FastifyReply) {
  const parsed = authorizeONUSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid authorize payload', parsed.error.flatten());

  const result = await onuService.authorizeONU(req.tenant!, parsed.data, req.id);
  return reply.status(202).send({ success: true, data: result });
}

export async function moveONU(req: FastifyRequest, reply: FastifyReply) {
  const parsed = moveONUSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid move payload', parsed.error.flatten());

  const result = await onuService.moveONU(req.tenant!, parsed.data, req.id);
  return reply.status(202).send({ success: true, data: result });
}

export async function enableONU(req: FastifyRequest, reply: FastifyReply) {
  const parsed = enableDisableONUSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid enable payload', parsed.error.flatten());

  const result = await onuService.enableONU(req.tenant!, parsed.data, req.id);
  return reply.status(202).send({ success: true, data: result });
}

export async function disableONU(req: FastifyRequest, reply: FastifyReply) {
  const parsed = enableDisableONUSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid disable payload', parsed.error.flatten());

  const result = await onuService.disableONU(req.tenant!, parsed.data, req.id);
  return reply.status(202).send({ success: true, data: result });
}

export async function deleteONU(req: FastifyRequest, reply: FastifyReply) {
  const parsed = deleteONUSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Invalid delete payload', parsed.error.flatten());

  const result = await onuService.deleteONU(req.tenant!, parsed.data, req.id);
  return reply.status(202).send({ success: true, data: result });
}

export async function restoreFactory(
  req: FastifyRequest<{ Body: { sn: string } }>,
  reply: FastifyReply,
) {
  const result = await onuService.restoreFactory(req.tenant!, { sn: req.body.sn }, req.id);
  return reply.status(202).send({ success: true, data: result });
}

export async function resyncConfig(
  req: FastifyRequest<{ Body: { sn: string } }>,
  reply: FastifyReply,
) {
  const result = await onuService.resyncConfig(req.tenant!, { sn: req.body.sn }, req.id);
  return reply.status(202).send({ success: true, data: result });
}

export async function getJobStatus(
  req: FastifyRequest<{ Params: { jobId: string } }>,
  reply: FastifyReply,
) {
  const status = await onuService.getJobStatus(req.params.jobId);
  return reply.send({ success: true, data: status });
}

export async function invalidateONUCache(
  req: FastifyRequest<{ Querystring: { sn?: string } }>,
  reply: FastifyReply,
) {
  const deleted = await onuService.invalidateONUCache(req.tenant!.id, req.query.sn);
  return reply.send({ success: true, data: { invalidated: deleted } });
}
