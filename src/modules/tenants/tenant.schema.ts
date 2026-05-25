import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  subdomain: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9-]+$/, 'Subdomain must be lowercase alphanumeric with hyphens'),
  xToken: z.string().min(10),
  description: z.string().max(500).optional(),
  rateLimitPerMinute: z.number().int().min(1).max(10000).default(100),
  rateLimitBurst: z.number().int().min(1).max(50000).default(200),
  contactEmail: z.string().email().optional(),
  contactName: z.string().max(100).optional(),
  cacheRules: z.record(z.number()).default({}),
});

export const updateTenantSchema = createTenantSchema.partial().omit({ subdomain: true });

export const tenantIdSchema = z.object({
  tenantId: z.string().uuid(),
});

export type CreateTenantDto = z.infer<typeof createTenantSchema>;
export type UpdateTenantDto = z.infer<typeof updateTenantSchema>;
