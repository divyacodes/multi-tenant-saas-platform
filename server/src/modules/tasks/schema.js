import { z } from 'zod';

const taskStatusEnum = z.enum(['Todo', 'In Progress', 'Done']);
const taskPriorityEnum = z.enum(['Low', 'Medium', 'High', 'Urgent']);

export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().uuid('Valid project ID required'),
    title: z.string().min(2, 'Task title must be at least 2 characters').max(255),
    description: z.string().max(3000).optional(),
    status: taskStatusEnum.default('Todo'),
    priority: taskPriorityEnum.default('Medium'),
    assignedTo: z.string().uuid().optional().nullable(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD').optional().nullable()
  })
});

export const updateTaskSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('Invalid task ID')
  }),
  body: z.object({
    title: z.string().min(2).max(255).optional(),
    description: z.string().max(3000).optional(),
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
    assignedTo: z.string().uuid().optional().nullable(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()
  })
});

export const queryTaskSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    projectId: z.string().uuid().optional(),
    assignedTo: z.string().uuid().optional(),
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
    search: z.string().optional(),
    sortBy: z.enum(['created_at', 'due_date', 'priority', 'status', 'title']).default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
});

export const taskIdParamSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('Invalid task ID')
  })
});
