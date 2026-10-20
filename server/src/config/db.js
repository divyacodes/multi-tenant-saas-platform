import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.IS_PRODUCTION ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: env.IS_PRODUCTION ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (!env.IS_PRODUCTION && !env.IS_TEST) {
    // Debug query logging in development if needed
  }
  return res;
};

export const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const checkDbConnection = async () => {
  try {
    const res = await query('SELECT NOW() as now, current_database() as db');
    return {
      connected: true,
      time: res.rows[0].now,
      database: res.rows[0].db
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};
