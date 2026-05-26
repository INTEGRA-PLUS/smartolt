import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './AppError';
import { logger } from '../utils/logger';

export function globalErrorHandler(
  error: FastifyError | AppError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const requestId = request.id;

  if (error instanceof ZodError) {
    reply.status(422).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.flatten().fieldErrors,
      },
      requestId,
    });
    return;
  }

  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error({ err: error, requestId }, 'Non-operational error');
    }

    reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
      requestId,
    });
    return;
  }

  // Fastify native errors (e.g. 404 route not found)
  const fastifyError = error as FastifyError;
  if (fastifyError.statusCode) {
    reply.status(fastifyError.statusCode).send({
      success: false,
      error: {
        code: 'HTTP_ERROR',
        message: fastifyError.message,
      },
      requestId,
    });
    return;
  }

  logger.error({ err: error, requestId }, 'Unexpected error');

  reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    requestId,
  });
}
