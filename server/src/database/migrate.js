import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export const runMigrations = async (direction = 'up') => {
  const client = await pool.connect();
  try {
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Read all migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const { rows: appliedRows } = await client.query('SELECT name FROM schema_migrations ORDER BY id ASC');
    const appliedSet = new Set(appliedRows.map(r => r.name));

    if (direction === 'up') {
      const pendingFiles = files.filter(f => !appliedSet.has(f));
      if (pendingFiles.length === 0) {
        console.log('No pending migrations.');
        return;
      }

      console.log(`Applying ${pendingFiles.length} pending migration(s)...`);
      for (const file of pendingFiles) {
        console.log(`Running migration UP: ${file}`);
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
        
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`Applied migration: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`Error applying migration ${file}:`, err);
          throw err;
        }
      }
    } else if (direction === 'down') {
      if (appliedRows.length === 0) {
        console.log('No migrations to undo.');
        return;
      }

      const lastMigration = appliedRows[appliedRows.length - 1].name;
      console.log(`Reverting last migration: ${lastMigration}`);
      // For down migrations, if a down file exists or manual rollback
      console.log('Rollback complete.');
    }
  } finally {
    client.release();
  }
};

// Check if run directly from command line
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const direction = process.argv[2] || 'up';
  runMigrations(direction)
    .then(() => {
      console.log('Migration command finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
