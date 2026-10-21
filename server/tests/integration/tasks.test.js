import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool, query } from '../../src/config/db.js';

describe('Task Management & Editing Integration Tests', () => {
  let token;
  let org;
  let user;
  let project;
  let task;
  const testEmail = `tasktester_${Date.now()}@testcorp.com`;

  beforeAll(async () => {
    // Register unique tenant user
    const resAuth = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        name: 'Task Tester',
        organizationName: 'Task Corp'
      });

    token = resAuth.body.data.token;
    org = resAuth.body.data.organization;
    user = resAuth.body.data.user;

    // Create a project
    const resProj = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Organization-Id', org.id)
      .send({
        name: 'Alpha Project',
        description: 'Testing task flows'
      });

    project = resProj.body.data;

    // Create initial task
    const resTask = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Organization-Id', org.id)
      .send({
        projectId: project.id,
        title: 'Initial Task',
        description: 'Original description',
        priority: 'Medium',
        status: 'Todo',
        assignedTo: user.id,
        dueDate: '2026-11-20'
      });

    task = resTask.body.data;
  });

  afterAll(async () => {
    if (org?.id) {
      await query('DELETE FROM organizations WHERE id = $1;', [org.id]);
    }
    if (user?.id) {
      await query('DELETE FROM users WHERE id = $1;', [user.id]);
    }
  });

  it('PATCH /api/tasks/:id successfully updates task fields (title, description, priority, status)', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Organization-Id', org.id)
      .send({
        title: 'Updated Task Title',
        description: 'Updated comprehensive description',
        priority: 'High',
        status: 'In Progress',
        assignedTo: user.id,
        dueDate: '2026-11-25'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Task Title');
    expect(res.body.data.description).toBe('Updated comprehensive description');
    expect(res.body.data.priority).toBe('High');
    expect(res.body.data.status).toBe('In Progress');
    expect(res.body.data.due_date).toBeDefined();
  });

  it('PATCH /api/tasks/:id handles partial updates without erroring on null/undefined parameters', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Organization-Id', org.id)
      .send({
        status: 'Done'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Done');
    expect(res.body.data.title).toBe('Updated Task Title');
  });

  it('PATCH /api/tasks/:id allows clearing dueDate by passing null', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Organization-Id', org.id)
      .send({
        dueDate: null
      });

    expect(res.status).toBe(200);
    expect(res.body.data.due_date).toBeNull();
  });
});
