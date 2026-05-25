import { logger } from './logger';

export interface RetryOptions {
  attempts: number;
  delay: number;
  backoffFactor?: number;
  maxDelay?: number;
  retryOn?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const {
    attempts,
    delay,
    backoffFactor = 2,
    maxDelay = 30000,
    retryOn = () => true,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !retryOn(error)) {
        throw error;
      }

      const backoffDelay = Math.min(delay * Math.pow(backoffFactor, attempt - 1), maxDelay);
      const jitter = Math.random() * 500;
      const totalDelay = backoffDelay + jitter;

      logger.warn(
        { attempt, totalDelay: Math.round(totalDelay), maxAttempts: attempts },
        'Retrying after failure',
      );

      onRetry?.(error, attempt);
      await sleep(totalDelay);
    }
  }

  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'];
    const networkError = error as Error & { code?: string };
    if (networkError.code && retryableCodes.includes(networkError.code)) return true;

    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status) {
      const status = axiosError.response.status;
      return status === 429 || status >= 500;
    }

    if (!('response' in error)) return true;
  }

  return false;
}
