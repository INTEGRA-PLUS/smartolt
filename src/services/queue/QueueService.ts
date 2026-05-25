import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { getRedisClient } from '../../infrastructure/redis/redis';
import { logger } from '../../shared/utils/logger';
import { env } from '../../config/env';
import { queueNames } from '../../config';

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
};

export interface QueueJobData {
  tenantId: string;
  operation: string;
  payload: Record<string, unknown>;
  requestId?: string;
}

export interface QueueJobResult {
  success: boolean;
  data?: unknown;
  error?: string;
  processedAt: string;
}

class QueueService {
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();
  private events = new Map<string, QueueEvents>();

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection,
        defaultJobOptions: {
          attempts: env.QUEUE_MAX_ATTEMPTS,
          backoff: {
            type: 'exponential',
            delay: env.QUEUE_BACKOFF_DELAY,
          },
          removeOnComplete: { count: 1000, age: 3600 },
          removeOnFail: { count: 5000, age: 86400 },
        },
      });

      queue.on('error', (err) => {
        logger.error({ err, queue: name }, 'Queue error');
      });

      this.queues.set(name, queue);
    }

    return this.queues.get(name)!;
  }

  async addJob<T extends QueueJobData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: {
      delay?: number;
      priority?: number;
      jobId?: string;
    },
  ): Promise<Job<T, QueueJobResult>> {
    const queue = this.getQueue(queueName);

    const job = await queue.add(jobName, data, {
      delay: options?.delay,
      priority: options?.priority,
      jobId: options?.jobId,
    });

    logger.info(
      {
        jobId: job.id,
        queue: queueName,
        operation: data.operation,
        tenantId: data.tenantId,
      },
      'Job added to queue',
    );

    return job as Job<T, QueueJobResult>;
  }

  async getJobStatus(
    queueName: string,
    jobId: string,
  ): Promise<{ status: string; result?: unknown; error?: string } | null> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);

    if (!job) return null;

    const state = await job.getState();
    return {
      status: state,
      result: job.returnvalue,
      error: job.failedReason,
    };
  }

  registerWorker(
    queueName: string,
    processor: (job: Job<QueueJobData, QueueJobResult>) => Promise<QueueJobResult>,
  ): Worker {
    const worker = new Worker(queueName, processor, {
      connection,
      concurrency: env.QUEUE_CONCURRENCY,
    });

    worker.on('completed', (job) => {
      logger.info(
        { jobId: job.id, queue: queueName, operation: job.data.operation },
        'Job completed',
      );
    });

    worker.on('failed', (job, err) => {
      logger.error(
        {
          jobId: job?.id,
          queue: queueName,
          operation: job?.data.operation,
          err,
          attempts: job?.attemptsMade,
        },
        'Job failed',
      );
    });

    worker.on('stalled', (jobId) => {
      logger.warn({ jobId, queue: queueName }, 'Job stalled');
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  async pause(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) await queue.pause();
  }

  async resume(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) await queue.resume();
  }

  async getQueueMetrics(queueName: string) {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  async closeAll(): Promise<void> {
    await Promise.all([
      ...Array.from(this.workers.values()).map((w) => w.close()),
      ...Array.from(this.queues.values()).map((q) => q.close()),
    ]);
    logger.info('All queues and workers closed');
  }
}

export const queueService = new QueueService();
