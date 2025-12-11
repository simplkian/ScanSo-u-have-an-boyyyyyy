import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Support both Replit PostgreSQL (DATABASE_URL) and Supabase PostgreSQL
// Supabase connection format: postgresql://postgres:[DB_PASSWORD]@[HOST]:6543/postgres
// Or use the direct connection string from Supabase dashboard

function getDatabaseUrl(): string {
  // If DATABASE_URL is set, use it (works for both Replit and Supabase)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Build connection string from Supabase environment variables
  if (process.env.SUPABASE_URL && process.env.DB_PASSWORD) {
    // Extract project ref from SUPABASE_URL (https://[project-ref].supabase.co)
    const supabaseUrl = new URL(process.env.SUPABASE_URL);
    const projectRef = supabaseUrl.hostname.split('.')[0];
    // Use pooler connection (port 6543) for better connection handling
    return `postgresql://postgres.${projectRef}:${process.env.DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
  }
  
  throw new Error(
    "DATABASE_URL must be set, or provide SUPABASE_URL and DB_PASSWORD.",
  );
}

const databaseUrl = getDatabaseUrl();

// Configure SSL for Supabase connections (required for external connections)
const isSupabase = databaseUrl.includes('supabase');
const poolConfig: pg.PoolConfig = {
  connectionString: databaseUrl,
  ...(isSupabase && {
    ssl: {
      rejectUnauthorized: false, // Supabase uses self-signed certs
    },
  }),
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });
