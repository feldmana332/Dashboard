// One-time database setup: runs db/schema.sql against DATABASE_URL.
// Usage: DATABASE_URL=... npm run db:init
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf8');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. See .env.example.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log('Database schema is ready.');
} catch (err) {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
