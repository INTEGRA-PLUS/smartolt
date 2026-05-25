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

  app.get(
    '/:tenantId',
    { ...opts, schema: { tags: ['Tenants'], summary: 'Get tenant by ID' } },
    getTenant,
  );

  app.patch(
    '/:tenantId',
    { ...opts, schema: { tags: ['Tenants'], summary: 'Update tenant' } },
    updateTenant,
  );

  app.delete(
    '/:tenantId',
    { ...opts, schema: { tags: ['Tenants'], summary: 'Delete tenant' } },
    deleteTenant,
  );

  app.post(
    '/:tenantId/toggle-status',
    { ...opts, schema: { tags: ['Tenants'], summary: 'Toggle tenant active status' } },
    toggleTenantStatus,
  );

  app.get(
    '/:tenantId/stats',
    { ...opts, schema: { tags: ['Tenants'], summary: 'Get tenant statistics' } },
    getTenantStats,
  );
}
