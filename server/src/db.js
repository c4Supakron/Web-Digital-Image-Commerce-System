import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined }
    : undefined,
);

export async function query(text, params) {
  return pool.query(text, params);
}
