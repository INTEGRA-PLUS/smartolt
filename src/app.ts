import 'dotenv/config';
import Fastify from 'fastify';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { globalErrorHandler } from './shared/errors/errorHandler';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/prisma';
import { connectRedis, disconnectRedis } from './infrastructure/redis/redis';

import { registerSwagger } from './plugins/swagger.plugin';
import { registerCors } from './plugins/cors.plugin';
import { registerHelmet } from './plugins/helmet.plugin';
import { registerAuth } from './plugins/auth.plugin';
import { registerRateLimit } from './plugins/rateLimit.plugin';

import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { tenantRoutes } from './modules/tenants/tenant.routes';
import { oltRoutes } from './modules/olts/olt.routes';
import { onuRoutes } from './modules/onus/onu.routes';

import { addRequestId } from './middleware/requestId.middleware';
import { registerONUWorker } from './services/queue/workers/onu.worker';
import { registerSyncWorker } from './services/queue/workers/sync.worker';
import { authService } from './modules/auth/auth.service';

async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      }),
    },
    genReqId: () => require('uuid').v4(),
    trustProxy: true,
    requestTimeout: 60000,
    bodyLimit: 1048576,
  });

  // Error handler
  app.setErrorHandler(globalErrorHandler);

  // Request lifecycle hooks
  app.addHook('onRequest', addRequestId);

  // Plugins
  await registerHelmet(app);
  await registerCors(app);
  await registerSwagger(app);
  await registerAuth(app);
  await registerRateLimit(app);

  // Init auth service with app reference
  authService.init(app);

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(tenantRoutes, { prefix: '/api/v1/tenants' });
  await app.register(oltRoutes, { prefix: '/api/v1/olts' });
  await app.register(onuRoutes, { prefix: '/api/v1/onus' });

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` },
    });
  });

  return app;
}

async function start() {
  let app: Awaited<ReturnType<typeof buildApp>> | null = null;

  try {
    logger.info('Starting SmartOLT Gateway...');

    await connectDatabase();
    await connectRedis();

    app = await buildApp();

    // Register queue workers
    registerONUWorker();
    registerSyncWorker();

    await app.listen({ host: env.APP_HOST, port: env.APP_PORT });

    logger.info(`
╔═══════════════════════════════════════════════════╗
║         SmartOLT Gateway API Started              ║
╠═══════════════════════════════════════════════════╣
║  URL:      http://${env.APP_HOST}:${env.APP_PORT}
║  Env:      ${env.NODE_ENV}
║  Docs:     http://${env.APP_HOST}:${env.APP_PORT}/docs
║  Health:   http://${env.APP_HOST}:${env.APP_PORT}/health
╚═══════════════════════════════════════════════════╝
    `);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    try {
      if (app) await app.close();
      await disconnectDatabase();
      await disconnectRedis();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection');
    process.exit(1);
  });
}

start();
