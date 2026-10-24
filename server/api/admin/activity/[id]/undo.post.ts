import { createError, defineEventHandler, getRouterParam } from 'h3';
import { and, desc, eq, ne } from 'drizzle-orm';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { activityLog } from '~/server/utils/schema';
import { resourceTables } from '~/server/utils/content';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = Number(getRouterParam(event, 'id'));
  if (!Number.isSafeInteger(id) || id < 1) throw createError({ statusCode: 400, statusMessage: 'Action invalide.' });
  const db = getDatabase();
  const [entry] = await db.select().from(activityLog).where(eq(activityLog.id, id)).limit(1);
  if (!entry || !entry.resourceId || !(entry.resource in resourceTables)) throw createError({ statusCode: 404, statusMessage: 'Action annulable introuvable.' });
  const [newer] = await db.select({ id: activityLog.id }).from(activityLog)
    .where(and(eq(activityLog.resource, entry.resource), eq(activityLog.resourceId, entry.resourceId), ne(activityLog.id, entry.id)))
    .orderBy(desc(activityLog.id)).limit(1);
  if (newer && newer.id > entry.id) throw createError({ statusCode: 409, statusMessage: 'Action trop ancienne.', message: 'Une modification plus récente concerne cette fiche. L’annulation directe n’est plus sûre.' });
  const table = resourceTables[entry.resource as keyof typeof resourceTables] as any;
  if (entry.action === 'create') {
    const rows = await db.delete(table).where(eq(table.id, entry.resourceId)).returning({ id: table.id });
    if (!rows.length) throw createError({ statusCode: 409, statusMessage: 'Fiche déjà modifiée ou supprimée.' });
  } else if (entry.action === 'update') {
    if (!entry.before || typeof entry.before !== 'object') throw createError({ statusCode: 409, statusMessage: 'Aucun état précédent disponible.' });
    const { id: _id, ...previous } = entry.before as Record<string, unknown>;
    const rows = await db.update(table).set(previous).where(eq(table.id, entry.resourceId)).returning({ id: table.id });
    if (!rows.length) throw createError({ statusCode: 409, statusMessage: 'Fiche supprimée depuis cette modification.' });
  } else if (entry.action === 'delete') {
    if (!entry.before || typeof entry.before !== 'object') throw createError({ statusCode: 409, statusMessage: 'Aucun état précédent disponible.' });
    const [existing] = await db.select({ id: table.id }).from(table).where(eq(table.id, entry.resourceId)).limit(1);
    if (existing) throw createError({ statusCode: 409, statusMessage: 'Une fiche utilise déjà cet identifiant.' });
    await db.insert(table).values(entry.before as any);
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Type d’action non annulable.' });
  }
  await db.insert(activityLog).values({
    action: 'undo', resource: entry.resource, resourceId: entry.resourceId,
    summary: `Annulation · ${entry.summary}`, before: entry.after, after: entry.before,
  });
  return { ok: true };
});
