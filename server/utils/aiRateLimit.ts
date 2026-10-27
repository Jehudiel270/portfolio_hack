import { createError } from 'h3';

const requestWindowMs = 60 * 60 * 1000;
const requestCounts = new Map<string, { startedAt: number; count: number }>();

export function enforceAiRequestLimit(adminId: number, action: string, limit: number) {
  const now = Date.now();
  const key = `${adminId}:${action}`;
  const previous = requestCounts.get(key);
  if (!previous || now - previous.startedAt >= requestWindowMs) {
    requestCounts.set(key, { startedAt: now, count: 1 });
    return;
  }
  if (previous.count >= limit) {
    throw createError({ statusCode: 429, statusMessage: `Limite atteinte : ${limit} demandes par heure pour cette fonction.` });
  }
  previous.count += 1;
}
