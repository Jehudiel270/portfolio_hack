import { createError, defineEventHandler, getRouterParam } from 'h3';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { projects } from '~/server/utils/schema';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const slug = getRouterParam(event, 'slug') || '';
  const [project] = await getDatabase().select().from(projects).where(eq(projects.slug, slug)).limit(1);
  if (!project) throw createError({ statusCode: 404, statusMessage: 'Projet introuvable.' });
  return project;
});
