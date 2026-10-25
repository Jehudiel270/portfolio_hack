import { createError, getRequestIP, type H3Event } from 'h3';
import { eq, lt, sql } from 'drizzle-orm';
import { getDatabase } from './database';
import { hashAdminLoginIp } from './auth';
import { adminLoginAttempts } from './schema';

const maximumAttempts = 8;

function requestIp(event: H3Event) {
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown';
}

export async function registerAdminAuthAttempt(event: H3Event) {
  const ipHash = hashAdminLoginIp(requestIp(event));
  const db = getDatabase();
  const now = new Date();
  const [record] = await db.insert(adminLoginAttempts).values({
    ipHash,
    attempts: 1,
    windowStartedAt: now,
  }).onConflictDoUpdate({
    target: adminLoginAttempts.ipHash,
    set: {
      attempts: sql`CASE WHEN ${adminLoginAttempts.windowStartedAt} <= now() - interval '15 minutes' THEN 1 ELSE ${adminLoginAttempts.attempts} + 1 END`,
      windowStartedAt: sql`CASE WHEN ${adminLoginAttempts.windowStartedAt} <= now() - interval '15 minutes' THEN now() ELSE ${adminLoginAttempts.windowStartedAt} END`,
    },
  }).returning({ attempts: adminLoginAttempts.attempts });
  await db.delete(adminLoginAttempts).where(lt(adminLoginAttempts.windowStartedAt, new Date(now.getTime() - 24 * 60 * 60_000)));
  if (record.attempts > maximumAttempts) {
    throw createError({ statusCode: 429, statusMessage: 'Trop de tentatives. Réessaie dans quelques minutes.' });
  }
  return ipHash;
}

export async function clearAdminAuthAttempts(ipHash: string) {
  await getDatabase().delete(adminLoginAttempts).where(eq(adminLoginAttempts.ipHash, ipHash));
}
