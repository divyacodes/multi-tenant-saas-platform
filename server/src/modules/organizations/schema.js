import { z } from 'zod';

export const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters').max(100)
  })
});

export const updateOrgSchema = z.object({
  params: z.object({
    organizationId: z.string().uuid('Invalid organization ID format')
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional()
  })
});

export const addMemberSchema = z.object({
  params: z.object({
    organizationId: z.string().uuid()
  }),
  body: z.object({
    email: z.string().email('Invalid email address'),
    roleName: z.enum(['Admin', 'Manager', 'Member']).default('Member')
  })
});

export const updateMemberSchema = z.object({
  params: z.object({
    organizationId: z.string().uuid(),
    membershipId: z.string().uuid()
  }),
  body: z.object({
    roleName: z.enum(['Admin', 'Manager', 'Member']).optional(),
    status: z.enum(['active', 'suspended']).optional()
  })
});
