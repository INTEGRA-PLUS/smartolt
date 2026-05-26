import { smartOLTClient } from '../../services/smartolt/SmartOLTClient';
import { cacheService } from '../../services/cache/CacheService';
import { SMARTOLT_ENDPOINTS } from '../../services/smartolt/smartolt.endpoints';
import { buildCacheKey } from '../../shared/utils/helpers';
import { cacheConfig } from '../../config';
import type { TenantContext } from '../../shared/types/common.types';
import type { OLT } from '../../services/smartolt/smartolt.types';

export class OLTService {
  async getOLTs(tenant: TenantContext): Promise<{ data: OLT[]; fromCache: boolean; meta?: object }> {
    const cacheKey = buildCacheKey(`tenant:${tenant.id}`, 'olts');
    const ttl = (tenant.cacheRules['olts'] as number | undefined) ?? cacheConfig.ttl.olts;

    const result = await cacheService.getOrSet<OLT[]>(
      cacheKey,
      async () => {
        const response = await smartOLTClient.get<OLT[]>(
          tenant.subdomain,
          tenant.xToken,
          SMARTOLT_ENDPOINTS.GET_OLTS,
        );
        return Array.isArray(response.data) ? response.data : [];
      },
      { ttl, tags: [`tenant:${tenant.id}`, 'olts'] },
    );

    return {
      data: result.data,
      fromCache: result.fromCache,
      meta: result.meta,
    };
  }

  async getOLTDetail(
    tenant: TenantContext,
    oltId: string,
  ): Promise<{ data: OLT; fromCache: boolean }> {
    const cacheKey = buildCacheKey(`tenant:${tenant.id}`, 'olt', oltId);
    const ttl = (tenant.cacheRules['olts'] as number | undefined) ?? cacheConfig.ttl.olts;

    const result = await cacheService.getOrSet<OLT>(
      cacheKey,
      async () => {
        const response = await smartOLTClient.get<OLT>(
          tenant.subdomain,
          tenant.xToken,
          SMARTOLT_ENDPOINTS.GET_OLT_DETAIL(oltId),
        );
        return response.data;
      },
      { ttl, tags: [`tenant:${tenant.id}`, 'olts'] },
    );

    return { data: result.data, fromCache: result.fromCache };
  }

  async getRunningConfig(tenant: TenantContext, oltId: string): Promise<unknown> {
    const response = await smartOLTClient.get(
      tenant.subdomain,
      tenant.xToken,
      SMARTOLT_ENDPOINTS.GET_OLT_RUNNING_CONFIG(oltId),
    );
    return response.data;
  }

  async invalidateCache(_tenantId: string): Promise<number> {
    return cacheService.deleteByTag('olts');
  }
}

export const oltService = new OLTService();
