import { prisma } from '../infrastructure/database/prisma';
import { queueService } from '../services/queue/QueueService';
import { queueNames } from '../config';
import { logger } from '../shared/utils/logger';

export async function scheduleCacheWarming(): Promise<void> {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true, status: 'active' },
    select: { id: true, name: true },
  });

  logger.info({ count: tenants.length }, 'Scheduling cache warming for tenants');

  for (const tenant of tenants) {
    await queueService.addJob(
      queueNames.backgroundSync,
      'warm_cache',
      {
        tenantId: tenant.id,
        operation: 'warm_cache',
        payload: {},
      },
      { delay: Math.random() * 5000 },
    );
  }
}
