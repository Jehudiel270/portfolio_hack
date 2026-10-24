import { createError, defineEventHandler, getRouterParam, readBody } from 'h3';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { getResource, resourceTables } from '~/server/utils/content';

const inputSchema = z.object({
  currentId: z.coerce.number().int().positive(),
  targetId: z.coerce.number().int().positive(),
}).refine((value) => value.currentId !== value.targetId);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const resource = getResource(getRouterParam(event, 'collection') || '');
  const parsed = inputSchema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Éléments de réordonnancement invalides.' });
  const table = resourceTables[resource] as any;
  const db = getDatabase();
  return db.transaction(async (transaction) => {
    const rows = await transaction.select().from(table).where(inArray(table.id, [parsed.data.currentId, parsed.data.targetId]));
    if (rows.length !== 2) throw createError({ statusCode: 404, statusMessage: 'Un élément à réordonner est introuvable.' });
    const current = rows.find((row) => row.id === parsed.data.currentId);
    const target = rows.find((row) => row.id === parsed.data.targetId);
    if (!current || !target) throw createError({ statusCode: 404, statusMessage: 'Un élément à réordonner est introuvable.' });
    await transaction.update(table).set({ sortOrder: target.sortOrder }).where(eq(table.id, current.id));
    await transaction.update(table).set({ sortOrder: current.sortOrder }).where(eq(table.id, target.id));
    return { ok: true };
  });
});
