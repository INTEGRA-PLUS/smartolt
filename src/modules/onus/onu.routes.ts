import { FastifyInstance } from 'fastify';
import {
  getONUs,
  getONUDetail,
  getONUStatus,
  getSignalLevels,
  getONUTypes,
  getUnauthorizedONUs,
  rebootONU,
  authorizeONU,
  moveONU,
  enableONU,
  disableONU,
  deleteONU,
  restoreFactory,
  resyncConfig,
  getJobStatus,
  invalidateONUCache,
} from './onu.controller';

export async function onuRoutes(app: FastifyInstance) {
  const opts = { onRequest: [app.authenticate] };

  // READ endpoints
  app.get('/', { ...opts, schema: { tags: ['ONUs'], summary: 'Get all ONUs (cached)' } }, getONUs);
  app.get('/unauthorized', { ...opts, schema: { tags: ['ONUs'], summary: 'Get unauthorized ONUs' } }, getUnauthorizedONUs);
  app.get('/types', { ...opts, schema: { tags: ['ONUs'], summary: 'Get ONU types (cached 24h)' } }, getONUTypes);
  app.get('/signal-levels', { ...opts, schema: { tags: ['ONUs'], summary: 'Get all signal levels (cached)' } }, getSignalLevels);
  app.get('/:sn', { ...opts, schema: { tags: ['ONUs'], summary: 'Get ONU detail by serial number' } }, getONUDetail);
  app.get('/:sn/status', { ...opts, schema: { tags: ['ONUs'], summary: 'Get ONU status' } }, getONUStatus);

  // WRITE operations (via queue)
  app.post('/reboot', { ...opts, schema: { tags: ['ONU Operations'], summary: 'Reboot ONU (queued)' } }, rebootONU);
  app.post('/authorize', { ...opts, schema: { tags: ['ONU Operations'], summary: 'Authorize ONU (queued)' } }, authorizeONU);
  app.post('/move', { ...opts, schema: { tags: ['ONU Operations'], summary: 'Move ONU (queued)' } }, moveONU);
  app.post('/enable', { ...opts, schema: { tags: ['ONU Operations'], summary: 'Enable ONU (queued)' } }, enableONU);
  app.post('/disable', { ...opts, schema: { tags: ['ONU Operations'], summary: 'Disable ONU (queued)' } }, disableONU);
  app.post('/delete', { ...opts, schema: { tags: ['ONU Operations'], summary: 'Delete ONU (queued)' } }, deleteONU);
  app.post('/restore-factory', { ...opts, schema: { tags: ['ONU Operations'], summary: 'Restore factory settings (queued)' } }, restoreFactory);
  app.post('/resync-config', { ...opts, schema: { tags: ['ONU Operations'], summary: 'Resync ONU config (queued)' } }, resyncConfig);

  // Job status
  app.get('/jobs/:jobId', { ...opts, schema: { tags: ['ONU Operations'], summary: 'Get job status' } }, getJobStatus);

  // Cache management
  app.delete('/cache', { ...opts, schema: { tags: ['ONUs'], summary: 'Invalidate ONU cache' } }, invalidateONUCache);
}
