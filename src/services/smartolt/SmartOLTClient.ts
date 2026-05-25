import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../shared/utils/logger';
import { withRetry, isRetryableError } from '../../shared/utils/retry';
import { buildSmartOLTUrl } from '../../shared/utils/helpers';
import { circuitBreaker } from '../circuit-breaker/CircuitBreaker';
import {
  SmartOLTError,
  SmartOLTTimeoutError,
  SmartOLTRateLimitError,
} from '../../shared/errors/SmartOLTError';
import type { SmartOLTRequestConfig, SmartOLTResponse } from './smartolt.types';

export class SmartOLTClient {
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: env.SMARTOLT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'SmartOLT-Gateway/1.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.httpClient.interceptors.request.use((config) => {
      config.metadata = { startTime: Date.now() };
      return config;
    });

    this.httpClient.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config.metadata?.startTime ?? Date.now());
        logger.debug(
          {
            url: response.config.url,
            status: response.status,
            duration,
          },
          'SmartOLT request completed',
        );
        return response;
      },
      (error: AxiosError) => {
        const duration = Date.now() - ((error.config as { metadata?: { startTime?: number } })?.metadata?.startTime ?? Date.now());
        logger.warn(
          {
            url: error.config?.url,
            status: error.response?.status,
            duration,
            message: error.message,
          },
          'SmartOLT request failed',
        );
        return Promise.reject(error);
      },
    );
  }

  async request<T = unknown>(config: SmartOLTRequestConfig): Promise<SmartOLTResponse<T>> {
    const {
      subdomain,
      xToken,
      endpoint,
      method = 'GET',
      params,
      data,
      timeout,
    } = config;

    const url = buildSmartOLTUrl(subdomain, endpoint);
    const circuitKey = `smartolt:${subdomain}`;

    return circuitBreaker.execute(
      circuitKey,
      async () => {
        return withRetry(
          async () => {
            try {
              const response = await this.httpClient.request<SmartOLTResponse<T>>({
                url,
                method,
                params,
                data,
                timeout: timeout ?? env.SMARTOLT_TIMEOUT,
                headers: {
                  'x-token': xToken,
                },
              });

              return response.data;
            } catch (error) {
              if (error instanceof AxiosError) {
                if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                  throw new SmartOLTTimeoutError(endpoint, subdomain);
                }

                if (error.response?.status === 429) {
                  throw new SmartOLTRateLimitError(subdomain);
                }

                const status = error.response?.status ?? 502;
                const message = this.extractErrorMessage(error);

                throw new SmartOLTError(
                  `SmartOLT error: ${message}`,
                  status,
                  {
                    tenantId: subdomain,
                    endpoint,
                    upstream: {
                      status,
                      message,
                      data: error.response?.data,
                    },
                  },
                );
              }

              throw error;
            }
          },
          {
            attempts: env.SMARTOLT_RETRY_ATTEMPTS,
            delay: env.SMARTOLT_RETRY_DELAY,
            backoffFactor: 2,
            maxDelay: 15000,
            retryOn: (err) => {
              if (err instanceof SmartOLTRateLimitError) return true;
              return isRetryableError(err);
            },
          },
        );
      },
      subdomain,
    );
  }

  async get<T = unknown>(
    subdomain: string,
    xToken: string,
    endpoint: string,
    params?: Record<string, unknown>,
  ): Promise<SmartOLTResponse<T>> {
    return this.request<T>({ subdomain, xToken, endpoint, method: 'GET', params });
  }

  async post<T = unknown>(
    subdomain: string,
    xToken: string,
    endpoint: string,
    data?: Record<string, unknown>,
  ): Promise<SmartOLTResponse<T>> {
    return this.request<T>({ subdomain, xToken, endpoint, method: 'POST', data });
  }

  private extractErrorMessage(error: AxiosError): string {
    const responseData = error.response?.data as Record<string, unknown> | undefined;
    if (responseData?.message && typeof responseData.message === 'string') {
      return responseData.message;
    }
    if (responseData?.error && typeof responseData.error === 'string') {
      return responseData.error;
    }
    return error.message || 'Unknown SmartOLT error';
  }
}

export const smartOLTClient = new SmartOLTClient();
