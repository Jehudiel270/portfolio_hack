import { createError, defineEventHandler, getRouterParam, readBody } from 'h3';
import { and, eq, ne, sql, type SQL } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireSuperAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { admins } from '~/server/utils/schema';
import { normalizeAdminPermissions, type AdminPermission } from '~/shared/adminPermissions';

const schema = z.object({
  active: z.boolean().optional(),
  password: z.string().min(12).max(256).optional(),
  resetMfa: z.boolean().optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
}).refine((value) => value.active !== undefined || value.password !== undefined || value.resetMfa !== undefined || value.permissions !== undefined);

function validatePermissions(value: Record<string, boolean>) {
  const permissions = normalizeAdminPermissions(value);
  for (const [key, allowed] of Object.entries(permissions)) {
    if (!allowed || key.endsWith('.view') || key === 'overview.view' || key === 'uploads.create' || key === 'cv.preview') continue;
    const group = key.slice(0, key.lastIndexOf('.'));
    if (permissions[`${group}.view` as AdminPermission] !== true) {
      throw createError({ statusCode: 400, statusMessage: `L’action ${key} nécessite aussi le droit de consultation.` });
    }
  }
  return permissions;
}

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const id = Number(getRouterParam(event, 'id'));
  if (!Number.isSafeInteger(id) || id < 1) throw createError({ statusCode: 400, statusMessage: 'Identifiant de compte invalide.' });
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Modifications du compte invalides.' });
  const [target] = await getDatabase().select({ id: admins.id, role: admins.role }).from(admins).where(eq(admins.id, id)).limit(1);
  if (!target || target.role === 'super_admin') throw createError({ statusCode: 404, statusMessage: 'Compte administrateur introuvable.' });

  const update: {
    active?: boolean;
    passwordHash?: string;
    permissions?: Record<string, boolean>;
    totpEnabled?: boolean;
    totpSecretCiphertext?: string | null;
    recoveryCodeHashes?: string[];
    sessionVersion?: SQL;
  } = {};
  if (parsed.data.active !== undefined) update.active = parsed.data.active;
  if (parsed.data.password) update.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  if (parsed.data.permissions) update.permissions = validatePermissions(parsed.data.permissions);
  if (parsed.data.resetMfa) {
    update.totpEnabled = false;
    update.totpSecretCiphertext = null;
    update.recoveryCodeHashes = [];
  }
  update.sessionVersion = sql`${admins.sessionVersion} + 1`;
  const [updated] = await getDatabase().update(admins).set(update).where(and(eq(admins.id, id), ne(admins.role, 'super_admin')))
    .returning({ id: admins.id, email: admins.email, role: admins.role, active: admins.active, permissions: admins.permissions, totpEnabled: admins.totpEnabled, createdAt: admins.createdAt });
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Compte administrateur introuvable.' });
  return { ...updated, permissions: normalizeAdminPermissions(updated.permissions) };
});
