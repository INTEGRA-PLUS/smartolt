import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export function generateId(): string {
  return uuidv4();
}

export function generateApiKey(): string {
  return `sgw_${crypto.randomBytes(32).toString('hex')}`;
}

export function hashApiKey(key: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(key).digest('hex');
}

export function buildCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return [prefix, ...parts].join(':');
}

export function buildSmartOLTUrl(subdomain: string, endpoint: string): string {
  return `https://${subdomain}.smartolt.com/api/${endpoint.replace(/^\//, '')}`;
}

export function sanitizeSubdomain(subdomain: string): string {
  return subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
}

export function isExpired(timestamp: number, ttlSeconds: number): boolean {
  return Date.now() > timestamp + ttlSeconds * 1000;
}

export function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
