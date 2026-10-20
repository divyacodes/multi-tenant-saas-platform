import { z } from 'zod';

const projectStatusEnum = z.enum(['Planning', 'Active', 'On Hold', 'Completed', 'Archived']);

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters').max(255),
    description: z.string().max(2000).optional(),
    status: projectStatusEnum.default('Active')
  })
});

export const updateProjectSchema = z.object({
  params: z.object({
    projectId: z.string().uuid('Invalid project ID')
  }),
  body: z.object({
    name: z.string().min(2).max(255).optional(),
    description: z.string().max(2000).optional(),
    status: projectStatusEnum.optional()
  })
});

export const queryProjectSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    status: projectStatusEnum.optional(),
    sortBy: z.enum(['name', 'status', 'created_at']).default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
});

export const projectIdParamSchema = z.object({
  params: z.object({
    projectId: z.string().uuid('Invalid project ID')
  })
});
