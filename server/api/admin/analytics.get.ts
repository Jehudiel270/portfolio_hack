import { defineEventHandler } from 'h3';
import { desc, gte } from 'drizzle-orm';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { pageViews } from '~/server/utils/schema';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const currentDate = new Date();
  const firstDay = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
  firstDay.setUTCDate(firstDay.getUTCDate() - 29);
  const since = firstDay.toISOString().slice(0, 10);
  return getDatabase().select().from(pageViews).where(gte(pageViews.day, since)).orderBy(desc(pageViews.day)).limit(500);
});
