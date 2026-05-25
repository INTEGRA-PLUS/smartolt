import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../infrastructure/database/prisma';
import { getRedisClient } from '../../infrastructure/redis/redis';
import { circuitBreaker } from '../../services/circuit-breaker/CircuitBreaker';
import { queueService } from '../../services/queue/QueueService';
import { queueNames } from '../../config';

export async function healthCheck(_req: FastifyRequest, reply: FastifyReply) {
  const startTime = Date.now();

  const [dbStatus, redisStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  const queueMetrics = await queueService.getQueueMetrics(queueNames.onuOperations).catch(() => null);
  const circuits = circuitBreaker.getAllStats();

  const allHealthy = dbStatus.status === 'ok' && redisStatus.status === 'ok';

  return reply.status(allHealthy ? 200 : 503).send({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: Date.now() - startTime,
    version: process.env.npm_package_version ?? '1.0.0',
    services: {
      database: dbStatus,
      redis: redisStatus,
      queues: queueMetrics ?? { error: 'unavailable' },
    },
    circuits,
  });
}

export async function readinessCheck(_req: FastifyRequest, reply: FastifyReply) {
  const [dbOk, redisOk] = await Promise.all([
    checkDatabase().then((r) => r.status === 'ok'),
    checkRedis().then((r) => r.status === 'ok'),
  ]);

  if (!dbOk || !redisOk) {
    return reply.status(503).send({ ready: false });
  }

  return reply.send({ ready: true });
}

export async function livenessCheck(_req: FastifyRequest, reply: FastifyReply) {
  return reply.send({ alive: true, timestamp: new Date().toISOString() });
}

export async function metricsCheck(_req: FastifyRequest, reply: FastifyReply) {
  const memUsage = process.memoryUsage();

  const [onuMetrics, syncMetrics] = await Promise.all([
    queueService.getQueueMetrics(queueNames.onuOperations).catch(() => null),
    queueService.getQueueMetrics(queueNames.backgroundSync).catch(() => null),
  ]);

  return reply.send({
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
    },
    queues: {
      onuOperations: onuMetrics,
      backgroundSync: syncMetrics,
    },
    circuits: circuitBreaker.getAllStats(),
  });
}

async function checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error', error: String(error) };
  }
}

async function checkRedis(): Promise<{ status: string; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    const redis = getRedisClient();
    await redis.ping();
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error', error: String(error) };
  }
}
