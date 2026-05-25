export { env } from './env';

export const cacheConfig = {
  ttl: {
    olts: parseInt(process.env.CACHE_TTL_OLTS ?? '600'),
    onus: parseInt(process.env.CACHE_TTL_ONUS ?? '300'),
    signalLevels: parseInt(process.env.CACHE_TTL_SIGNAL_LEVELS ?? '900'),
    onuStatus: parseInt(process.env.CACHE_TTL_ONU_STATUS ?? '300'),
    onuTypes: parseInt(process.env.CACHE_TTL_ONU_TYPES ?? '86400'),
    default: parseInt(process.env.CACHE_TTL_DEFAULT ?? '300'),
  },
  prefix: process.env.REDIS_KEY_PREFIX ?? 'smartolt:',
};

export const queueNames = {
  onuOperations: 'onu:operations',
  backgroundSync: 'background:sync',
  cacheWarmer: 'cache:warmer',
  auditLog: 'audit:log',
} as const;

export const circuitBreakerConfig = {
  threshold: parseInt(process.env.SMARTOLT_CIRCUIT_BREAKER_THRESHOLD ?? '5'),
  timeout: parseInt(process.env.SMARTOLT_CIRCUIT_BREAKER_TIMEOUT ?? '60000'),
  halfOpenRequests: 2,
};
