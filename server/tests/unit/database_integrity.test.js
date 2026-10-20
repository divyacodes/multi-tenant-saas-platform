import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool, query } from '../../src/config/db.js';
import { runMigrations } from '../../src/database/migrate.js';
import { seedDatabase } from '../../src/database/seeds/seed.js';

describe('Database Schema & Integrity Tests', () => {
  beforeAll(async () => {
    await runMigrations('up');
    await seedDatabase();
  });

  afterAll(async () => {
    // Clean up test records
    await query("DELETE FROM organizations WHERE slug IN ('test-org-a', 'test-org-b');");
    await query("DELETE FROM users WHERE email IN ('testuser1@example.com', 'testuser2@example.com');");
    await pool.end();
  });

  it('should have seeded 16 core permissions and 3 system roles', async () => {
    const permRes = await query('SELECT count(*) FROM permissions;');
    expect(parseInt(permRes.rows[0].count, 10)).toBeGreaterThanOrEqual(16);

    const roleRes = await query("SELECT name FROM roles WHERE organization_id IS NULL;");
    const roleNames = roleRes.rows.map(r => r.name);
    expect(roleNames).toContain('Admin');
    expect(roleNames).toContain('Manager');
    expect(roleNames).toContain('Member');
  });

  it('should enforce unique email constraint on users table', async () => {
    const email = 'testuser1@example.com';
    await query("DELETE FROM users WHERE email = $1", [email]);

    // First insert succeeds
    await query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)",
      ['User One', email, 'hash1']
    );

    // Duplicate insert fails with unique violation error code 23505
    let errorCaught = null;
    try {
      await query(
        "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)",
        ['User Duplicate', email, 'hash2']
      );
    } catch (err) {
      errorCaught = err;
    }

    expect(errorCaught).not.toBeNull();
    expect(errorCaught.code).toBe('23505');
  });

  it('should enforce composite foreign key preventing cross-tenant project task association', async () => {
    // Create Org A and Org B
    await query("DELETE FROM organizations WHERE slug IN ('test-org-a', 'test-org-b');");

    const orgARes = await query(
      "INSERT INTO organizations (name, slug) VALUES ('Org A', 'test-org-a') RETURNING id;"
    );
    const orgAId = orgARes.rows[0].id;

    const orgBRes = await query(
      "INSERT INTO organizations (name, slug) VALUES ('Org B', 'test-org-b') RETURNING id;"
    );
    const orgBId = orgBRes.rows[0].id;

    // Create Project inside Org A
    const projARes = await query(
      "INSERT INTO projects (name, organization_id) VALUES ('Project A', $1) RETURNING id;",
      [orgAId]
    );
    const projAId = projARes.rows[0].id;

    // Attempt to create a Task inside Org B referencing Project A (from Org A)
    // The composite constraint fk_tasks_project_org (project_id, organization_id) -> projects(id, organization_id)
    // MUST reject this at the database engine level!
    let errorCaught = null;
    try {
      await query(
        "INSERT INTO tasks (title, project_id, organization_id) VALUES ('Malicious Task', $1, $2);",
        [projAId, orgBId]
      );
    } catch (err) {
      errorCaught = err;
    }

    expect(errorCaught).not.toBeNull();
    // PostgreSQL error 23503: foreign_key_violation
    expect(errorCaught.code).toBe('23503');
  });
});
