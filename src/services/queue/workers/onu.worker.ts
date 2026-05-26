import { Job } from 'bullmq';
import { Prisma } from '@prisma/client';
import { queueService, QueueJobData, QueueJobResult } from '../QueueService';
import { smartOLTClient } from '../../smartolt/SmartOLTClient';
import { SMARTOLT_ENDPOINTS } from '../../smartolt/smartolt.endpoints';
import { prisma } from '../../../infrastructure/database/prisma';
import { logger } from '../../../shared/utils/logger';
import { queueNames } from '../../../config';

const ONU_OPERATIONS: Record<string, string> = {
  reboot: SMARTOLT_ENDPOINTS.REBOOT_ONU,
  authorize: SMARTOLT_ENDPOINTS.AUTHORIZE_ONU,
  move: SMARTOLT_ENDPOINTS.MOVE_ONU,
  enable: SMARTOLT_ENDPOINTS.ENABLE_ONU,
  disable: SMARTOLT_ENDPOINTS.DISABLE_ONU,
  delete: SMARTOLT_ENDPOINTS.DELETE_ONU,
  restore_factory: SMARTOLT_ENDPOINTS.RESTORE_FACTORY_ONU,
  resync_config: SMARTOLT_ENDPOINTS.RESYNC_CONFIG_ONU,
};

async function processor(
  job: Job<QueueJobData, QueueJobResult>,
): Promise<QueueJobResult> {
  const { tenantId, operation, payload, requestId } = job.data;

  logger.info({ jobId: job.id, tenantId, operation, requestId }, 'Processing ONU job');

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  if (!tenant.isActive) {
    throw new Error(`Tenant ${tenantId} is not active`);
  }

  const endpoint = ONU_OPERATIONS[operation];
  if (!endpoint) {
    throw new Error(`Unknown ONU operation: ${operation}`);
  }

  const result = await smartOLTClient.post(
    tenant.subdomain,
    tenant.xToken,
    endpoint,
    payload as Record<string, unknown>,
  );

  await prisma.auditLog.create({
    data: {
      tenantId,
      action: operation,
      resource: 'onu',
      resourceId: String(payload.sn ?? ''),
      status: result.success ? 'success' : 'failed',
      requestId: requestId ?? null,
      metadata: {
        jobId: job.id,
        payload,
        result: result.data,
      } as Prisma.InputJsonValue,
    },
  });

  return {
    success: result.success,
    data: result.data,
    processedAt: new Date().toISOString(),
  };
}

export function registerONUWorker(): void {
  queueService.registerWorker(queueNames.onuOperations, processor);
  logger.info('ONU operations worker registered');
}
