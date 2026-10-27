import { defineEventHandler } from 'h3';
import { asc } from 'drizzle-orm';
import { requireSuperAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { admins } from '~/server/utils/schema';
import { normalizeAdminPermissions } from '~/shared/adminPermissions';

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const records = await getDatabase()
    .select({ id: admins.id, email: admins.email, displayName: admins.displayName, role: admins.role, active: admins.active, permissions: admins.permissions, totpEnabled: admins.totpEnabled, createdAt: admins.createdAt })
    .from(admins)
    .orderBy(asc(admins.email));
  return records.map((record) => ({ ...record, permissions: normalizeAdminPermissions(record.permissions) }));
});
