import { defineEventHandler } from 'h3';
import { desc, gte } from 'drizzle-orm';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { pageViews } from '~/server/utils/schema';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  return getDatabase().select().from(pageViews).where(gte(pageViews.day, since)).orderBy(desc(pageViews.day)).limit(500);
});
