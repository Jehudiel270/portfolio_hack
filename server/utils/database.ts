import { createError } from 'h3';
import { useRuntimeConfig } from '#imports';
import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

let sqlClient: ReturnType<typeof postgres> | undefined;
let database: PostgresJsDatabase<typeof schema> | undefined;

export function getDatabase() {
  const config = useRuntimeConfig();
  if (!config.databaseUrl) throw createError({ statusCode: 503, statusMessage: 'La base Neon n’est pas configurée dans le coffre du projet.' });
  if (!sqlClient) {
    sqlClient = postgres(String(config.databaseUrl), { ssl: 'require', max: 5, connect_timeout: 10, idle_timeout: 20, prepare: false });
    database = drizzle(sqlClient, { schema });
  }
  return database!;
}
export function databaseIsConfigured() { return Boolean(useRuntimeConfig().databaseUrl); }
export async function closeDatabase() { if (sqlClient) { await sqlClient.end({ timeout: 5 }); sqlClient = undefined; database = undefined; } }
