import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================
// Supabase PostgreSQL is the ONLY active database for this application.
// The backend connects via DATABASE_URL environment variable.
// No fallback databases, no conditional connections.
//
// Connection String (from Supabase Dashboard → Settings → Database):
// postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
// ============================================================================

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. For Supabase, copy the connection string from your Supabase Dashboard → Settings → Database → Connection String (URI format).",
  );
}

const databaseUrl = process.env.DATABASE_URL;

// Configure SSL for Supabase connections (required for external connections)
// Supabase URLs contain 'supabase' or use port 6543
const isSupabase = databaseUrl.includes('supabase') || databaseUrl.includes(':6543');

// Pool configuration optimized for Supabase Transaction Pooler
const poolConfig: pg.PoolConfig = {
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ...(isSupabase && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
};

// Create pool ONCE at process startup - never create per-request
export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

// Pool event handlers for connection lifecycle logging
pool.on('error', (err) => {
  console.error('[DB POOL] Unexpected error on idle client:', err.message);
});

pool.on('connect', () => {
  if (process.env.DB_DEBUG === 'true') {
    console.log('[DB POOL] New client connected');
  }
});

// Debug logging interval (every 30 seconds when DB_DEBUG=true)
if (process.env.DB_DEBUG === 'true') {
  setInterval(() => {
    console.log(`[DB POOL] total=${pool.totalCount} idle=${pool.idleCount} waiting=${pool.waitingCount}`);
  }, 30000);
}

// Health check function to verify database connectivity
// Used by /api/health endpoint to confirm Supabase/PostgreSQL is reachable
export async function checkDatabaseHealth(): Promise<{ connected: boolean; error?: string }> {
  try {
    const result = await pool.query('SELECT 1 as ok');
    return { connected: result.rows[0]?.ok === 1 };
  } catch (error) {
    console.error('[DB POOL] Health check failed:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}

// Get current pool statistics for debugging
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Run a test query and return result (for /api/db-test endpoint)
export async function runDbTest(): Promise<{ success: boolean; timestamp?: string; error?: string }> {
  try {
    const result = await pool.query('SELECT now() as now');
    return { success: true, timestamp: result.rows[0]?.now };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Query failed' 
    };
  }
}
