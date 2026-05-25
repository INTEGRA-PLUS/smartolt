import { getRedisClient } from '../../infrastructure/redis/redis';
import { logger } from '../../shared/utils/logger';
import { cacheConfig } from '../../config';

export interface CacheSetOptions {
  ttl?: number;
  tags?: string[];
}

export interface CachedValue<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
  ttl: number;
  tags?: string[];
}

export class CacheService {
  private redis = getRedisClient();
  private readonly prefix: string;

  constructor(prefix = cacheConfig.prefix) {
    this.prefix = prefix;
  }

  private buildKey(key: string): string {
    return key;
  }

  async get<T>(key: string): Promise<CachedValue<T> | null> {
    try {
      const raw = await this.redis.get(this.buildKey(key));
      if (!raw) return null;
      return JSON.parse(raw) as CachedValue<T>;
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache get error');
      return null;
    }
  }

  async set<T>(key: string, data: T, options: CacheSetOptions = {}): Promise<void> {
    const ttl = options.ttl ?? cacheConfig.ttl.default;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const value: CachedValue<T> = {
      data,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ttl,
      tags: options.tags,
    };

    try {
      const builtKey = this.buildKey(key);
      await this.redis.setex(builtKey, ttl, JSON.stringify(value));

      if (options.tags?.length) {
        await this.indexTags(builtKey, options.tags, ttl);
      }
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache set error');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.buildKey(key));
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache delete error');
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.prefix}${pattern}`);
      if (keys.length === 0) return 0;

      const strippedKeys = keys.map((k) => k.replace(this.prefix, ''));
      const pipeline = this.redis.pipeline();
      strippedKeys.forEach((k) => pipeline.del(k));
      await pipeline.exec();

      logger.info({ pattern, deleted: keys.length }, 'Cache pattern deleted');
      return keys.length;
    } catch (error) {
      logger.warn({ err: error, pattern }, 'Cache deleteByPattern error');
      return 0;
    }
  }

  async deleteByTag(tag: string): Promise<number> {
    try {
      const tagKey = `tag:${tag}`;
      const members = await this.redis.smembers(tagKey);
      if (members.length === 0) return 0;

      const pipeline = this.redis.pipeline();
      members.forEach((k) => pipeline.del(k));
      pipeline.del(tagKey);
      await pipeline.exec();

      return members.length;
    } catch (error) {
      logger.warn({ err: error, tag }, 'Cache deleteByTag error');
      return 0;
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheSetOptions = {},
  ): Promise<{ data: T; fromCache: boolean; meta?: Pick<CachedValue<T>, 'cachedAt' | 'expiresAt' | 'ttl'> }> {
    const cached = await this.get<T>(key);

    if (cached) {
      return {
        data: cached.data,
        fromCache: true,
        meta: {
          cachedAt: cached.cachedAt,
          expiresAt: cached.expiresAt,
          ttl: cached.ttl,
        },
      };
    }

    const data = await fetcher();
    await this.set(key, data, options);
    return { data, fromCache: false };
  }

  async ttlRemaining(key: string): Promise<number> {
    return this.redis.ttl(this.buildKey(key));
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(this.buildKey(key));
    return result === 1;
  }

  async invalidateTenant(tenantId: string): Promise<number> {
    return this.deleteByPattern(`*tenant:${tenantId}*`);
  }

  private async indexTags(key: string, tags: string[], ttl: number): Promise<void> {
    const pipeline = this.redis.pipeline();
    tags.forEach((tag) => {
      pipeline.sadd(`tag:${tag}`, key);
      pipeline.expire(`tag:${tag}`, ttl + 60);
    });
    await pipeline.exec();
  }
}

export const cacheService = new CacheService();
