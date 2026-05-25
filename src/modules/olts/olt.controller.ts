import { FastifyRequest, FastifyReply } from 'fastify';
import { oltService } from './olt.service';

export async function getOLTs(req: FastifyRequest, reply: FastifyReply) {
  const { data, fromCache, meta } = await oltService.getOLTs(req.tenant!);
  return reply.send({
    success: true,
    data,
    meta: {
      ...meta,
      total: data.length,
      source: fromCache ? 'cache' : 'upstream',
    },
  });
}

export async function getOLTDetail(
  req: FastifyRequest<{ Params: { oltId: string } }>,
  reply: FastifyReply,
) {
  const { data, fromCache } = await oltService.getOLTDetail(req.tenant!, req.params.oltId);
  return reply.send({
    success: true,
    data,
    meta: { source: fromCache ? 'cache' : 'upstream' },
  });
}

export async function getRunningConfig(
  req: FastifyRequest<{ Params: { oltId: string } }>,
  reply: FastifyReply,
) {
  const data = await oltService.getRunningConfig(req.tenant!, req.params.oltId);
  return reply.send({ success: true, data });
}

export async function invalidateOLTCache(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const deleted = await oltService.invalidateCache(req.tenant!.id);
  return reply.send({ success: true, data: { invalidated: deleted } });
}
