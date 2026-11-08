import { neon } from '@neondatabase/serverless';

/**
 * Neon serverless driver — reads the connection string injected by Vercel's
 * Neon integration (DATABASE_URL). Falls back to POSTGRES_URL for legacy
 * Vercel Postgres databases that were migrated to Neon.
 */
const sql = neon(
  process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
);

export { sql };

/** Ensures the vocab table exists before running queries. */
export async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS vocab (
      id          SERIAL PRIMARY KEY,
      word        VARCHAR(255) NOT NULL,
      meaning     TEXT NOT NULL,
      example     TEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}
