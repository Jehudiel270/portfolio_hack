import { defineEventHandler } from 'h3';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { activityLog } from '~/server/utils/schema';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  return getDatabase().select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(100);
});
