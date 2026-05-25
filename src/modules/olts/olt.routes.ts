import { FastifyInstance } from 'fastify';
import { getOLTs, getOLTDetail, getRunningConfig, invalidateOLTCache } from './olt.controller';

export async function oltRoutes(app: FastifyInstance) {
  const opts = { onRequest: [app.authenticate] };

  app.get('/', { ...opts, schema: { tags: ['OLTs'], summary: 'Get all OLTs (cached)' } }, getOLTs);

  app.get(
    '/:oltId',
    { ...opts, schema: { tags: ['OLTs'], summary: 'Get OLT detail' } },
    getOLTDetail,
  );

  app.get(
    '/:oltId/running-config',
    { ...opts, schema: { tags: ['OLTs'], summary: 'Get OLT running configuration' } },
    getRunningConfig,
  );

  app.delete(
    '/cache',
    { ...opts, schema: { tags: ['OLTs'], summary: 'Invalidate OLT cache' } },
    invalidateOLTCache,
  );
}
