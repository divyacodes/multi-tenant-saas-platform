import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool, query } from '../../src/config/db.js';
import { runMigrations } from '../../src/database/migrate.js';
import { seedDatabase } from '../../src/database/seeds/seed.js';

describe('RBAC & Privilege Escalation Security Tests', () => {
  let adminUser, adminToken, org;
  let managerUser, managerToken, managerMembership;
  let memberUser, memberToken, memberMembership;
  let testProject;

  beforeAll(async () => {
    await runMigrations('up');
    await seedDatabase();

    await query("DELETE FROM users WHERE email LIKE '%@rbactest.com';");

    // 1. Register Admin and Organization
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Super Admin',
        email: 'admin@rbactest.com',
        password: 'Password123!',
        organizationName: 'Security Corp'
      });
    adminUser = regRes.body.data.user;
    adminToken = regRes.body.data.token;
    org = regRes.body.data.organization;

    // 2. Register Manager user account
    const mgrReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Team Manager',
        email: 'manager@rbactest.com',
        password: 'Password123!',
        organizationName: 'Manager Temp Org'
      });
    managerUser = mgrReg.body.data.user;
    managerToken = mgrReg.body.data.token;

    // Add Manager to Security Corp with 'Manager' role
    const addMgrRes = await request(app)
      .post(`/api/organizations/${org.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Organization-Id', org.id)
      .send({
        email: managerUser.email,
        roleName: 'Manager'
      });
    managerMembership = addMgrRes.body.data.membership;

    // 3. Register Member user account
    const memReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Regular Member',
        email: 'member@rbactest.com',
        password: 'Password123!',
        organizationName: 'Member Temp Org'
      });
    memberUser = memReg.body.data.user;
    memberToken = memReg.body.data.token;

    // Add Member to Security Corp with 'Member' role
    const addMemRes = await request(app)
      .post(`/api/organizations/${org.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Organization-Id', org.id)
      .send({
        email: memberUser.email,
        roleName: 'Member'
      });
    memberMembership = addMemRes.body.data.membership;

    // Create a project as Admin
    const pRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Organization-Id', org.id)
      .send({
        name: 'Main Protected Project',
        description: 'Test project for RBAC',
        status: 'Active'
      });
    testProject = pRes.body.data;
  });

  afterAll(async () => {
    await query("DELETE FROM users WHERE email LIKE '%@rbactest.com';");
    await pool.end();
  });

  it('Admin CAN create project, delete project, and manage roles', async () => {
    // Admin creates project
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Organization-Id', org.id)
      .send({ name: 'Admin Temp Project' });
    expect(res.status).toBe(201);

    // Admin deletes project
    const delRes = await request(app)
      .delete(`/api/projects/${res.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Organization-Id', org.id);
    expect(delRes.status).toBe(200);
  });

  it('Manager CAN create and update projects, but CANNOT delete projects', async () => {
    // Manager creates project
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('X-Organization-Id', org.id)
      .send({ name: 'Manager Project' });
    expect(createRes.status).toBe(201);

    // Manager attempts to delete project -> 403 Forbidden
    const delRes = await request(app)
      .delete(`/api/projects/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .set('X-Organization-Id', org.id);
    expect(delRes.status).toBe(403);
    expect(delRes.body.message).toContain('project:delete');
  });

  it('Manager CANNOT create custom roles or manage permissions', async () => {
    const res = await request(app)
      .post(`/api/organizations/${org.id}/roles`)
      .set('Authorization', `Bearer ${managerToken}`)
      .set('X-Organization-Id', org.id)
      .send({
        name: 'Unauthorized Role',
        permissionKeys: ['organization:read']
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('role:manage');
  });

  it('Member CANNOT create projects', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('X-Organization-Id', org.id)
      .send({ name: 'Member Illegal Project' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('project:create');
  });

  it('User CANNOT change their own role to gain privileges (privilege escalation check)', async () => {
    // Member tries to promote themselves to Admin
    const res = await request(app)
      .patch(`/api/organizations/${org.id}/members/${memberMembership.id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .set('X-Organization-Id', org.id)
      .send({ roleName: 'Admin' });

    expect(res.status).toBe(403);
  });

  it('Admin CANNOT demote the sole active administrator', async () => {
    // Fetch Admin membership ID
    const membersRes = await request(app)
      .get(`/api/organizations/${org.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Organization-Id', org.id);

    const adminMem = membersRes.body.data.find(m => m.user_id === adminUser.id);

    const res = await request(app)
      .patch(`/api/organizations/${org.id}/members/${adminMem.membership_id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Organization-Id', org.id)
      .send({ roleName: 'Member' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('sole active administrator');
  });
});
