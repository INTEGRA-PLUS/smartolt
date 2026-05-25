import { Tenant } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prisma';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError';
import { sanitizeSubdomain } from '../../shared/utils/helpers';
import type { CreateTenantDto, UpdateTenantDto } from './tenant.schema';

export class TenantService {
  async findAll(): Promise<Omit<Tenant, 'xToken'>[]> {
    return prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        xToken: false,
        isActive: true,
        status: true,
        description: true,
        cacheRules: true,
        rateLimitPerMinute: true,
        rateLimitBurst: true,
        contactEmail: true,
        contactName: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Omit<Tenant, 'xToken'>> {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        subdomain: true,
        xToken: false,
        isActive: true,
        status: true,
        description: true,
        cacheRules: true,
        rateLimitPerMinute: true,
        rateLimitBurst: true,
        contactEmail: true,
        contactName: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) throw new NotFoundError('Tenant', id);
    return tenant;
  }

  async findByIdWithToken(id: string): Promise<Tenant> {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundError('Tenant', id);
    return tenant;
  }

  async create(dto: CreateTenantDto): Promise<Omit<Tenant, 'xToken'>> {
    const subdomain = sanitizeSubdomain(dto.subdomain);

    const existing = await prisma.tenant.findUnique({ where: { subdomain } });
    if (existing) throw new ConflictError(`Subdomain '${subdomain}' is already in use`);

    const tenant = await prisma.tenant.create({
      data: {
        ...dto,
        subdomain,
      },
    });

    return this.findById(tenant.id);
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Omit<Tenant, 'xToken'>> {
    await this.findById(id);

    await prisma.tenant.update({
      where: { id },
      data: dto,
    });

    return this.findById(id);
  }

  async toggleStatus(id: string): Promise<{ isActive: boolean }> {
    const tenant = await this.findByIdWithToken(id);

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        isActive: !tenant.isActive,
        status: tenant.isActive ? 'inactive' : 'active',
      },
      select: { isActive: true },
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await prisma.tenant.delete({ where: { id } });
  }

  async getStats(id: string) {
    await this.findById(id);

    const [auditLogs, queueJobs, apiKeys] = await Promise.all([
      prisma.auditLog.count({ where: { tenantId: id } }),
      prisma.queueJob.count({ where: { tenantId: id } }),
      prisma.apiKey.count({ where: { tenantId: id, status: 'active' } }),
    ]);

    return { auditLogs, queueJobs, activeApiKeys: apiKeys };
  }
}

export const tenantService = new TenantService();
