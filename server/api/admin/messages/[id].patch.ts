import { createError, defineEventHandler, getRouterParam, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { contactMessages } from '~/server/utils/schema';

const inputSchema = z.object({
  processingStatus: z.enum(['new', 'in_progress', 'done']).optional(),
  archived: z.boolean().optional(),
}).refine((value) => value.processingStatus !== undefined || value.archived !== undefined);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = Number(getRouterParam(event, 'id'));
  if (!Number.isSafeInteger(id) || id < 1) throw createError({ statusCode: 400, statusMessage: 'Identifiant de message invalide.' });
  const parsed = inputSchema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Mise à jour de message invalide.' });
  const { archived, ...fields } = parsed.data;
  const update = {
    ...fields,
    ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }),
  };
  const [message] = await getDatabase().update(contactMessages).set(update).where(eq(contactMessages.id, id)).returning();
  if (!message) throw createError({ statusCode: 404, statusMessage: 'Message introuvable.' });
  return message;
});
