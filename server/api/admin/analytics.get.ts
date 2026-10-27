import { defineEventHandler } from 'h3';
import { desc, gte } from 'drizzle-orm';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { analyticsEvents, pageViews } from '~/server/utils/schema';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const currentDate = new Date();
  const firstDay = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
  firstDay.setUTCDate(firstDay.getUTCDate() - 29);
  const since = firstDay.toISOString().slice(0, 10);
  const database = getDatabase();
  const [views, events] = await Promise.all([
    database.select().from(pageViews).where(gte(pageViews.day, since)).orderBy(desc(pageViews.day)).limit(500),
    database.select().from(analyticsEvents).where(gte(analyticsEvents.day, since)).orderBy(desc(analyticsEvents.day)).limit(1000),
  ]);
  return { views, events };
});
