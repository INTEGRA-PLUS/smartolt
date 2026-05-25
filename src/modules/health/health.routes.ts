import { FastifyInstance } from 'fastify';
import { healthCheck, readinessCheck, livenessCheck, metricsCheck } from './health.controller';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', { schema: { tags: ['System'], summary: 'Full health check' } }, healthCheck);
  app.get('/ready', { schema: { tags: ['System'], summary: 'Kubernetes readiness probe' } }, readinessCheck);
  app.get('/live', { schema: { tags: ['System'], summary: 'Kubernetes liveness probe' } }, livenessCheck);
  app.get('/metrics', { schema: { tags: ['System'], summary: 'Application metrics' } }, metricsCheck);
}
