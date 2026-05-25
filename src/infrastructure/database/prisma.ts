import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ],
  });

if (process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = prisma;
}

prisma.$on('warn' as never, (e: { message: string }) => {
  logger.warn({ prisma: e }, 'Prisma warning');
});

prisma.$on('error' as never, (e: { message: string }) => {
  logger.error({ prisma: e }, 'Prisma error');
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL connected');
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to PostgreSQL');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected');
}
