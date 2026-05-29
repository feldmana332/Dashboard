import { Pool } from 'pg';

// A single shared connection pool. In Next.js dev the module can be reloaded,
// so we stash the pool on globalThis to avoid opening a new pool each time.
const globalForPool = globalThis;

export const pool =
  globalForPool._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

if (!globalForPool._pgPool) {
  globalForPool._pgPool = pool;
}

export function query(text, params) {
  return pool.query(text, params);
}

// Run a function inside a transaction, automatically committing or rolling back.
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
