import { z } from 'zod';

export const rebootONUSchema = z.object({
  sn: z.string().min(1),
  olt_id: z.union([z.string(), z.number()]).optional(),
});

export const authorizeONUSchema = z.object({
  sn: z.string().min(1),
  olt_id: z.union([z.string(), z.number()]),
  port: z.union([z.string(), z.number()]),
  profile: z.string().optional(),
  name: z.string().optional(),
  vlan: z.union([z.string(), z.number()]).optional(),
});

export const moveONUSchema = z.object({
  sn: z.string().min(1),
  from_olt: z.union([z.string(), z.number()]).optional(),
  to_olt: z.union([z.string(), z.number()]),
  to_port: z.union([z.string(), z.number()]),
});

export const enableDisableONUSchema = z.object({
  sn: z.string().min(1),
  olt_id: z.union([z.string(), z.number()]).optional(),
});

export const deleteONUSchema = z.object({
  sn: z.string().min(1),
  olt_id: z.union([z.string(), z.number()]).optional(),
});

export type RebootONUDto = z.infer<typeof rebootONUSchema>;
export type AuthorizeONUDto = z.infer<typeof authorizeONUSchema>;
export type MoveONUDto = z.infer<typeof moveONUSchema>;
export type EnableDisableONUDto = z.infer<typeof enableDisableONUSchema>;
export type DeleteONUDto = z.infer<typeof deleteONUSchema>;
