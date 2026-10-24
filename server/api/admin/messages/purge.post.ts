import { defineEventHandler } from 'h3';
import { lt } from 'drizzle-orm';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { contactMessages } from '~/server/utils/schema';
import { readSiteSetting } from '~/server/utils/siteSettings';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const days = await readSiteSetting('contact_retention_days', 365);
  const cutoff = new Date(Date.now() - days * 86400000);
  const removed = await getDatabase().delete(contactMessages).where(lt(contactMessages.createdAt, cutoff)).returning({ id: contactMessages.id });
  return { deleted: removed.length, retentionDays: days };
});
