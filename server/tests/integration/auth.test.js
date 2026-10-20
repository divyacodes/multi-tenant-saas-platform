import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool, query } from '../../src/config/db.js';
import { runMigrations } from '../../src/database/migrate.js';
import { seedDatabase } from '../../src/database/seeds/seed.js';

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    await runMigrations('up');
    await seedDatabase();
    // Clean up test users
    await query("DELETE FROM users WHERE email LIKE '%@authtest.com';");
  });

  afterAll(async () => {
    await query("DELETE FROM users WHERE email LIKE '%@authtest.com';");
    await pool.end();
  });

  const testUser = {
    name: 'Alice Auth',
    email: 'alice@authtest.com',
    password: 'Password123!',
    organizationName: 'Alice Enterprises'
  };

  it('POST /api/auth/register should create user, organization and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.organization.name).toBe(testUser.organizationName);
    expect(res.body.data.token).toBeDefined();
    // Verify password hash is never exposed
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it('POST /api/auth/register with duplicate email should return 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login with valid credentials should succeed', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.organizations.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/auth/login with invalid password should return 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me without token should return 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me with invalid token should return 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_garbage_token');

    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me with valid token should return profile and organizations', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(testUser.email);
    expect(meRes.body.data.organizations).toBeDefined();
  });
});
