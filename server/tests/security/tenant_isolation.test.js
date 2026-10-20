import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool, query } from '../../src/config/db.js';
import { runMigrations } from '../../src/database/migrate.js';
import { seedDatabase } from '../../src/database/seeds/seed.js';

describe('Multi-Tenant Strict Isolation Security Tests', () => {
  let userA, tokenA, orgA;
  let userB, tokenB, orgB;
  let projectA, projectB;
  let taskA, taskB;

  beforeAll(async () => {
    await runMigrations('up');
    await seedDatabase();

    // Clean up test data
    await query("DELETE FROM users WHERE email LIKE '%@tenanttest.com';");

    // 1. Register User A and Org A
    const regARes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Corp Admin',
        email: 'alice@tenanttest.com',
        password: 'Password123!',
        organizationName: 'Acme Technologies'
      });
    userA = regARes.body.data.user;
    tokenA = regARes.body.data.token;
    orgA = regARes.body.data.organization;

    // 2. Register User B and Org B
    const regBRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Corp Admin',
        email: 'bob@tenanttest.com',
        password: 'Password123!',
        organizationName: 'Bright Solutions'
      });
    userB = regBRes.body.data.user;
    tokenB = regBRes.body.data.token;
    orgB = regBRes.body.data.organization;

    // 3. Create Project in Org A
    const pARes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id)
      .send({
        name: 'Acme Super Secret Project',
        description: 'Proprietary Project for Org A',
        status: 'Active'
      });
    projectA = pARes.body.data;

    // 4. Create Project in Org B
    const pBRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Organization-Id', orgB.id)
      .send({
        name: 'Bright Solutions Public App',
        description: 'Org B Project',
        status: 'Active'
      });
    projectB = pBRes.body.data;

    // 5. Create Task in Org A
    const tARes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id)
      .send({
        projectId: projectA.id,
        title: 'Acme Task Alpha',
        priority: 'High',
        status: 'In Progress'
      });
    taskA = tARes.body.data;

    // 6. Create Task in Org B
    const tBRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Organization-Id', orgB.id)
      .send({
        projectId: projectB.id,
        title: 'Bright Task Beta',
        priority: 'Medium',
        status: 'Todo'
      });
    taskB = tBRes.body.data;
  });

  afterAll(async () => {
    await query("DELETE FROM users WHERE email LIKE '%@tenanttest.com';");
    await pool.end();
  });

  it('RULE 1: Organization A user CANNOT list Organization B projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id);

    expect(res.status).toBe(200);
    const projectNames = res.body.data.map(p => p.name);
    expect(projectNames).toContain('Acme Super Secret Project');
    expect(projectNames).not.toContain('Bright Solutions Public App');
  });

  it('RULE 2: Organization A user CANNOT spoof header to access Organization B', async () => {
    // User A provides Org B's ID in header
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgB.id);

    // Must be rejected with 403 Forbidden!
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('RULE 3: Organization A user CANNOT view Organization B project by ID', async () => {
    // Request Org B's project ID with Org A context
    const res = await request(app)
      .get(`/api/projects/${projectB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id);

    // Returns 404 (does not reveal existence in another tenant)
    expect(res.status).toBe(404);
  });

  it('RULE 4: Organization A user CANNOT update Organization B project', async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id)
      .send({ name: 'Hacked Project Name' });

    expect(res.status).toBe(404);

    // Verify Org B project was unaffected
    const checkRes = await request(app)
      .get(`/api/projects/${projectB.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Organization-Id', orgB.id);
    expect(checkRes.body.data.name).toBe('Bright Solutions Public App');
  });

  it('RULE 5: Organization A user CANNOT delete Organization B project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id);

    expect(res.status).toBe(404);

    // Verify still exists in Org B
    const checkRes = await request(app)
      .get(`/api/projects/${projectB.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Organization-Id', orgB.id);
    expect(checkRes.status).toBe(200);
  });

  it('RULE 6: Organization A user CANNOT access Organization B tasks', async () => {
    // Cannot retrieve by ID
    const resById = await request(app)
      .get(`/api/tasks/${taskB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id);
    expect(resById.status).toBe(404);

    // Cannot list
    const resList = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id);
    const titles = resList.body.data.map(t => t.title);
    expect(titles).toContain('Acme Task Alpha');
    expect(titles).not.toContain('Bright Task Beta');
  });

  it('RULE 7: Organization A CANNOT assign a task to Organization B user', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id)
      .send({
        projectId: projectA.id,
        title: 'Cross-Tenant Exploit Task',
        assignedTo: userB.id // User B belongs only to Org B
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('active member of this organization');
  });

  it('RULE 8: Dashboard statistics never include another organization records', async () => {
    const resA = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id);

    expect(resA.status).toBe(200);
    expect(resA.body.data.total_projects).toBe(1);
    expect(resA.body.data.total_tasks).toBe(1);

    const resB = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Organization-Id', orgB.id);

    expect(resB.status).toBe(200);
    expect(resB.body.data.total_projects).toBe(1);
    expect(resB.body.data.total_tasks).toBe(1);
  });

  it('RULE 9: Suspended membership cannot access tenant data', async () => {
    // Suspend User A in Org A directly in DB
    await query(
      "UPDATE memberships SET status = 'suspended' WHERE user_id = $1 AND organization_id = $2;",
      [userA.id, orgA.id]
    );

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('suspended');

    // Restore active status
    await query(
      "UPDATE memberships SET status = 'active' WHERE user_id = $1 AND organization_id = $2;",
      [userA.id, orgA.id]
    );
  });

  it('RULE 10: Concurrent requests do not cross or mix tenant contexts', async () => {
    const reqA = request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgA.id);

    const reqB = request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Organization-Id', orgB.id);

    const [resA, resB] = await Promise.all([reqA, reqB]);

    expect(resA.body.data[0].name).toBe('Acme Super Secret Project');
    expect(resB.body.data[0].name).toBe('Bright Solutions Public App');
  });
});
