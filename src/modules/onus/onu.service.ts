import { smartOLTClient } from '../../services/smartolt/SmartOLTClient';
import { cacheService } from '../../services/cache/CacheService';
import { queueService } from '../../services/queue/QueueService';
import { SMARTOLT_ENDPOINTS } from '../../services/smartolt/smartolt.endpoints';
import { buildCacheKey } from '../../shared/utils/helpers';
import { cacheConfig, queueNames } from '../../config';
import type { TenantContext } from '../../shared/types/common.types';
import type { ONU, ONUStatus, SignalLevel, ONUType } from '../../services/smartolt/smartolt.types';
import type { RebootONUDto, AuthorizeONUDto, MoveONUDto, EnableDisableONUDto, DeleteONUDto } from './onu.schema';

export class ONUService {
  async getONUs(tenant: TenantContext, oltId?: string): Promise<{ data: ONU[]; fromCache: boolean }> {
    const cacheKey = oltId
      ? buildCacheKey(`tenant:${tenant.id}`, 'onus', 'olt', oltId)
      : buildCacheKey(`tenant:${tenant.id}`, 'onus');
    const ttl = (tenant.cacheRules['onus'] as number | undefined) ?? cacheConfig.ttl.onus;
    const endpoint = oltId ? SMARTOLT_ENDPOINTS.GET_ONUS_BY_OLT(oltId) : SMARTOLT_ENDPOINTS.GET_ONUS;

    const result = await cacheService.getOrSet<ONU[]>(
      cacheKey,
      async () => {
        const response = await smartOLTClient.get<ONU[]>(tenant.subdomain, tenant.xToken, endpoint);
        return Array.isArray(response.data) ? response.data : [];
      },
      { ttl, tags: [`tenant:${tenant.id}`, 'onus'] },
    );

    return { data: result.data, fromCache: result.fromCache };
  }

  async getONUDetail(tenant: TenantContext, sn: string): Promise<{ data: ONU; fromCache: boolean }> {
    const cacheKey = buildCacheKey(`tenant:${tenant.id}`, 'onu', sn);
    const ttl = (tenant.cacheRules['onus'] as number | undefined) ?? cacheConfig.ttl.onus;

    const result = await cacheService.getOrSet<ONU>(
      cacheKey,
      async () => {
        const response = await smartOLTClient.get<ONU>(tenant.subdomain, tenant.xToken, SMARTOLT_ENDPOINTS.GET_ONU_DETAIL(sn));
        return response.data;
      },
      { ttl, tags: [`tenant:${tenant.id}`, 'onus'] },
    );

    return { data: result.data, fromCache: result.fromCache };
  }

  async getONUStatus(tenant: TenantContext, sn: string): Promise<{ data: ONUStatus; fromCache: boolean }> {
    const cacheKey = buildCacheKey(`tenant:${tenant.id}`, 'onu-status', sn);
    const ttl = (tenant.cacheRules['onu_status'] as number | undefined) ?? cacheConfig.ttl.onuStatus;

    const result = await cacheService.getOrSet<ONUStatus>(
      cacheKey,
      async () => {
        const response = await smartOLTClient.get<ONUStatus>(tenant.subdomain, tenant.xToken, SMARTOLT_ENDPOINTS.GET_ONU_STATUS(sn));
        return response.data;
      },
      { ttl, tags: [`tenant:${tenant.id}`, 'onu-status'] },
    );

    return { data: result.data, fromCache: result.fromCache };
  }

  async getSignalLevels(tenant: TenantContext, sn?: string): Promise<{ data: SignalLevel | SignalLevel[]; fromCache: boolean }> {
    const cacheKey = sn
      ? buildCacheKey(`tenant:${tenant.id}`, 'signal', sn)
      : buildCacheKey(`tenant:${tenant.id}`, 'signals');
    const ttl = (tenant.cacheRules['signal_levels'] as number | undefined) ?? cacheConfig.ttl.signalLevels;
    const endpoint = sn ? SMARTOLT_ENDPOINTS.GET_SIGNAL_LEVEL_BY_SN(sn) : SMARTOLT_ENDPOINTS.GET_SIGNAL_LEVELS;

    const result = await cacheService.getOrSet<SignalLevel | SignalLevel[]>(
      cacheKey,
      async () => {
        const response = await smartOLTClient.get<SignalLevel | SignalLevel[]>(tenant.subdomain, tenant.xToken, endpoint);
        return response.data;
      },
      { ttl, tags: [`tenant:${tenant.id}`, 'signals'] },
    );

    return { data: result.data, fromCache: result.fromCache };
  }

  async getONUTypes(tenant: TenantContext): Promise<{ data: ONUType[]; fromCache: boolean }> {
    const cacheKey = buildCacheKey(`tenant:${tenant.id}`, 'onu-types');
    const ttl = (tenant.cacheRules['onu_types'] as number | undefined) ?? cacheConfig.ttl.onuTypes;

    const result = await cacheService.getOrSet<ONUType[]>(
      cacheKey,
      async () => {
        const response = await smartOLTClient.get<ONUType[]>(tenant.subdomain, tenant.xToken, SMARTOLT_ENDPOINTS.GET_ONU_TYPES);
        return Array.isArray(response.data) ? response.data : [];
      },
      { ttl, tags: [`tenant:${tenant.id}`, 'onu-types'] },
    );

    return { data: result.data, fromCache: result.fromCache };
  }

  async getUnauthorizedONUs(tenant: TenantContext): Promise<{ data: ONU[]; fromCache: boolean }> {
    const cacheKey = buildCacheKey(`tenant:${tenant.id}`, 'onus', 'unauthorized');
    const ttl = 60;

    const result = await cacheService.getOrSet<ONU[]>(
      cacheKey,
      async () => {
        const response = await smartOLTClient.get<ONU[]>(tenant.subdomain, tenant.xToken, SMARTOLT_ENDPOINTS.GET_UNAUTHORIZED_ONUS);
        return Array.isArray(response.data) ? response.data : [];
      },
      { ttl, tags: [`tenant:${tenant.id}`, 'onus'] },
    );

    return { data: result.data, fromCache: result.fromCache };
  }

  // Write operations via queue
  async enqueueOperation(
    tenant: TenantContext,
    operation: string,
    payload: Record<string, unknown>,
    requestId?: string,
  ): Promise<{ jobId: string; status: string }> {
    const job = await queueService.addJob(queueNames.onuOperations, operation, {
      tenantId: tenant.id,
      operation,
      payload,
      requestId,
    });

    return { jobId: String(job.id), status: 'queued' };
  }

  async rebootONU(tenant: TenantContext, dto: RebootONUDto, requestId?: string) {
    return this.enqueueOperation(tenant, 'reboot', dto as Record<string, unknown>, requestId);
  }

  async authorizeONU(tenant: TenantContext, dto: AuthorizeONUDto, requestId?: string) {
    return this.enqueueOperation(tenant, 'authorize', dto as Record<string, unknown>, requestId);
  }

  async moveONU(tenant: TenantContext, dto: MoveONUDto, requestId?: string) {
    return this.enqueueOperation(tenant, 'move', dto as Record<string, unknown>, requestId);
  }

  async enableONU(tenant: TenantContext, dto: EnableDisableONUDto, requestId?: string) {
    return this.enqueueOperation(tenant, 'enable', dto as Record<string, unknown>, requestId);
  }

  async disableONU(tenant: TenantContext, dto: EnableDisableONUDto, requestId?: string) {
    return this.enqueueOperation(tenant, 'disable', dto as Record<string, unknown>, requestId);
  }

  async deleteONU(tenant: TenantContext, dto: DeleteONUDto, requestId?: string) {
    return this.enqueueOperation(tenant, 'delete', dto as Record<string, unknown>, requestId);
  }

  async restoreFactory(tenant: TenantContext, payload: { sn: string }, requestId?: string) {
    return this.enqueueOperation(tenant, 'restore_factory', payload, requestId);
  }

  async resyncConfig(tenant: TenantContext, payload: { sn: string }, requestId?: string) {
    return this.enqueueOperation(tenant, 'resync_config', payload, requestId);
  }

  async getJobStatus(jobId: string) {
    return queueService.getJobStatus(queueNames.onuOperations, jobId);
  }

  async invalidateONUCache(tenantId: string, sn?: string): Promise<number> {
    if (sn) {
      const keys = [
        `tenant:${tenantId}:onu:${sn}`,
        `tenant:${tenantId}:onu-status:${sn}`,
        `tenant:${tenantId}:signal:${sn}`,
      ];
      await Promise.all(keys.map((k) => cacheService.delete(k)));
      return keys.length;
    }
    return cacheService.deleteByTag('onus');
  }
}

export const onuService = new ONUService();
