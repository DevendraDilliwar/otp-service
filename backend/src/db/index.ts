/**
 * Drizzle Client Initialization
 * Uses Neon serverless driver
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { config } from '../config/index.js';
import * as schema from './schema.js';

const sql = neon(config.databaseUrl);
export const db = drizzle(sql, { schema });

/**
 * Verification function for DB connection
 */
export async function initDb() {
  try {
    // Simple query to verify connection
    await sql`SELECT 1`;
    console.log('Connected to Neon Database via Drizzle');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}
