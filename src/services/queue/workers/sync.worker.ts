import { Job } from 'bullmq';
import { queueService, QueueJobData, QueueJobResult } from '../QueueService';
import { smartOLTClient } from '../../smartolt/SmartOLTClient';
import { SMARTOLT_ENDPOINTS } from '../../smartolt/smartolt.endpoints';
import { cacheService } from '../../cache/CacheService';
import { prisma } from '../../../infrastructure/database/prisma';
import { logger } from '../../../shared/utils/logger';
import { queueNames, cacheConfig } from '../../../config';
import { buildCacheKey } from '../../../shared/utils/helpers';

async function processor(
  job: Job<QueueJobData, QueueJobResult>,
): Promise<QueueJobResult> {
  const { tenantId, operation } = job.data;

  logger.info({ jobId: job.id, tenantId, operation }, 'Processing sync job');

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || !tenant.isActive) {
    return { success: false, error: 'Tenant not found or inactive', processedAt: new Date().toISOString() };
  }

  if (operation === 'warm_cache') {
    await warmTenantCache(tenant.id, tenant.subdomain, tenant.xToken);
  }

  return { success: true, processedAt: new Date().toISOString() };
}

async function warmTenantCache(
  tenantId: string,
  subdomain: string,
  xToken: string,
): Promise<void> {
  const tasks = [
    {
      key: buildCacheKey(`tenant:${tenantId}`, 'olts'),
      endpoint: SMARTOLT_ENDPOINTS.GET_OLTS,
      ttl: cacheConfig.ttl.olts,
    },
    {
      key: buildCacheKey(`tenant:${tenantId}`, 'onu_types'),
      endpoint: SMARTOLT_ENDPOINTS.GET_ONU_TYPES,
      ttl: cacheConfig.ttl.onuTypes,
    },
  ];

  for (const task of tasks) {
    try {
      const result = await smartOLTClient.get(subdomain, xToken, task.endpoint);
      await cacheService.set(task.key, result.data, {
        ttl: task.ttl,
        tags: [`tenant:${tenantId}`],
      });
      logger.debug({ tenantId, key: task.key }, 'Cache warmed');
    } catch (error) {
      logger.warn({ err: error, tenantId, endpoint: task.endpoint }, 'Cache warm failed');
    }
  }
}

export function registerSyncWorker(): void {
  queueService.registerWorker(queueNames.backgroundSync, processor);
  logger.info('Sync worker registered');
}
