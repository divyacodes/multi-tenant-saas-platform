import { z } from 'zod';

export const createRoleSchema = z.object({
  params: z.object({
    organizationId: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(2).max(50),
    description: z.string().max(255).optional(),
    permissionKeys: z.array(z.string()).min(1, 'At least one permission required')
  })
});

export const updateRoleSchema = z.object({
  params: z.object({
    organizationId: z.string().uuid(),
    roleId: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().max(255).optional(),
    permissionKeys: z.array(z.string()).optional()
  })
});
