export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    cached?: boolean;
    cachedAt?: string;
    cacheExpiresAt?: string;
    source?: 'cache' | 'upstream';
  };
  requestId?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface TenantContext {
  id: string;
  name: string;
  subdomain: string;
  xToken: string;
  status: string;
  cacheRules: Record<string, number>;
  rateLimits: {
    requestsPerMinute: number;
    burstSize: number;
  };
}

export type JobStatus = 'pending' | 'active' | 'completed' | 'failed' | 'delayed';

export interface JobResult<T = unknown> {
  jobId: string;
  status: JobStatus;
  data?: T;
  error?: string;
  attempts?: number;
  createdAt: string;
  processedAt?: string;
}
