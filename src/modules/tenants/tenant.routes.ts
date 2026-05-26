import { FastifyInstance } from 'fastify';
import {
  listTenants,
  getTenant,
  createTenant,
  updateTenant,
  toggleTenantStatus,
  deleteTenant,
  getTenantStats,
} from './tenant.controller';

export async function tenantRoutes(app: FastifyInstance) {
  const opts = { onRequest: [app.authenticate] };

  app.get('/', { ...opts, schema: { tags: ['Tenants'], summary: 'List all tenants' } }, listTenants);

  app.post('/', { ...opts, schema: { tags: ['Tenants'], summary: 'Create a new tenant' } }, createTenant);

  app.get<{ Params: { tenantId: string } }>(
    '/:tenantId',
    { ...opts, schema: { tags: ['Tenants'], summary: 'Get tenant by ID' } },
    getTenant,
  );

  app.patch<{ Params: { tenantId: string } }>(
    '/:tenantId',
    { ...opts, schema: { tags: ['Tenants'], summary: 'Update tenant' } },
    updateTenant,
  );

  app.delete<{ Params: { tenantId: string } }>(
    '/:tenantId',
    { ...opts, schema: { tags: ['Tenants'], summary: 'Delete tenant' } },
    deleteTenant,
  );

  app.post<{ Params: { tenantId: string } }>(
    '/:tenantId/toggle-status',
    { ...opts, schema: { tags: ['Tenants'], summary: 'Toggle tenant active status' } },
    toggleTenantStatus,
  );

  app.get<{ Params: { tenantId: string } }>(
    '/:tenantId/stats',
    { ...opts, schema: { tags: ['Tenants'], summary: 'Get tenant statistics' } },
    getTenantStats,
  );
}
