import { FastifyRequest } from 'fastify';
import { TenantContext } from './common.types';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: TenantContext;
    userId?: string;
    requestStartTime?: number;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: 'admin' | 'client' | 'readonly';
  iat: number;
  exp: number;
}

export type AuthenticatedRequest = FastifyRequest & {
  user: JwtPayload;
  tenant: TenantContext;
};
