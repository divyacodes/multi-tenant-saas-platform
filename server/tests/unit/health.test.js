import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { pool } from '../../src/config/db.js';

describe('Health & Database Connectivity Check', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('GET /api/health should return 200 and healthy DB connection', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.database.connected).toBe(true);
    expect(res.body.database.database).toBeDefined();
  });

  it('GET /api/nonexistent should return 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
