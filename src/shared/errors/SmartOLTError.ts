import { AppError } from './AppError';

export class SmartOLTError extends AppError {
  public readonly tenantId?: string;
  public readonly endpoint?: string;
  public readonly upstream?: {
    status?: number;
    message?: string;
    data?: unknown;
  };

  constructor(
    message: string,
    statusCode = 502,
    details?: {
      tenantId?: string;
      endpoint?: string;
      upstream?: { status?: number; message?: string; data?: unknown };
    },
  ) {
    super(message, statusCode, 'SMARTOLT_ERROR', true, details);
    this.tenantId = details?.tenantId;
    this.endpoint = details?.endpoint;
    this.upstream = details?.upstream;
  }
}

export class SmartOLTTimeoutError extends SmartOLTError {
  constructor(endpoint: string, tenantId?: string) {
    super(`SmartOLT timeout on ${endpoint}`, 504, { tenantId, endpoint });
    this.name = 'SmartOLTTimeoutError';
  }
}

export class SmartOLTCircuitOpenError extends SmartOLTError {
  constructor(tenantId?: string) {
    super('SmartOLT circuit breaker is open — upstream unavailable', 503, { tenantId });
    this.name = 'SmartOLTCircuitOpenError';
  }
}

export class SmartOLTRateLimitError extends SmartOLTError {
  constructor(tenantId?: string) {
    super('SmartOLT rate limit reached', 429, { tenantId });
    this.name = 'SmartOLTRateLimitError';
  }
}
