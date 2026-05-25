import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(2).max(100),
  expiresAt: z.string().datetime().optional(),
  permissions: z.array(z.string()).default([]),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type CreateApiKeyDto = z.infer<typeof createApiKeySchema>;
