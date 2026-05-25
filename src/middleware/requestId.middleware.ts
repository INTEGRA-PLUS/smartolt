import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

export function addRequestId(req: FastifyRequest, reply: FastifyReply, done: () => void): void {
  req.requestStartTime = Date.now();
  if (!req.id) {
    (req as FastifyRequest & { id: string }).id = uuidv4();
  }
  reply.header('X-Request-Id', req.id);
  done();
}
