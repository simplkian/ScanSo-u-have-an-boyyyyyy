import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Database connection configuration
// Supports both Replit built-in PostgreSQL and Supabase PostgreSQL
// 
// For Supabase: Get your connection string from Supabase Dashboard:
//   Settings → Database → Connection String (URI format)
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. For Supabase, copy the connection string from your Supabase Dashboard → Settings → Database → Connection String (URI format).",
  );
}

const databaseUrl = process.env.DATABASE_URL;

// Configure SSL for Supabase connections (required for external connections)
// Supabase URLs contain 'supabase' or use port 6543
const isSupabase = databaseUrl.includes('supabase') || databaseUrl.includes(':6543');
const poolConfig: pg.PoolConfig = {
  connectionString: databaseUrl,
  ...(isSupabase && {
    ssl: {
      rejectUnauthorized: false, // Required for Supabase pooler connections
    },
  }),
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });
