import { createError, defineEventHandler, readBody } from 'h3';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireSuperAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { admins } from '~/server/utils/schema';
import { normalizeAdminPermissions, SUPER_ADMIN_EMAIL, type AdminPermission } from '~/shared/adminPermissions';

const schema = z.object({
  email: z.string().trim().email().max(320),
  displayName: z.string().trim().min(1).max(120),
  password: z.string().min(12).max(256),
  permissions: z.record(z.string(), z.boolean()),
});

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
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Nom affiché, adresse, mot de passe ou permissions invalides.' });
  const email = parsed.data.email.toLowerCase();
  if (email === SUPER_ADMIN_EMAIL) throw createError({ statusCode: 409, statusMessage: 'Cette adresse est réservée au super-administrateur.' });
  const db = getDatabase();
  const [created] = await db.insert(admins).values({
    email,
    displayName: parsed.data.displayName,
    passwordHash: await bcrypt.hash(parsed.data.password, 12),
    role: 'admin',
    active: true,
    permissions: validatePermissions(parsed.data.permissions),
  }).onConflictDoNothing({ target: admins.email }).returning({ id: admins.id, email: admins.email, displayName: admins.displayName, role: admins.role, active: admins.active, permissions: admins.permissions, totpEnabled: admins.totpEnabled, createdAt: admins.createdAt });
  if (!created) throw createError({ statusCode: 409, statusMessage: 'Un compte existe déjà avec cette adresse.' });
  return { ...created, permissions: normalizeAdminPermissions(created.permissions) };
});
