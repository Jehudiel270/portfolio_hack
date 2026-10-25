import { defineEventHandler, readBody } from 'h3';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDatabase, databaseIsConfigured } from '~/server/utils/database';
import { pageViews } from '~/server/utils/schema';

const schema = z.object({ path: z.string().max(120) });
const publicPaths = new Set(['/', '/parcours', '/projets', '/competences', '/ia', '/certifications', '/contact', '/confidentialite']);

export default defineEventHandler(async (event) => {
  if (!databaseIsConfigured()) return { recorded: false };
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) return { recorded: false };
  const rawPath = parsed.data.path.split('?')[0].split('#')[0];
  const path = publicPaths.has(rawPath) ? rawPath : /^\/projets\/[a-z0-9-]+$/.test(rawPath) ? '/projets/:slug' : null;
  if (!path || path.startsWith('/admin')) return { recorded: false };
  const day = new Date().toISOString().slice(0, 10);
  await getDatabase().insert(pageViews).values({ day, path, views: 1 })
    .onConflictDoUpdate({ target: [pageViews.day, pageViews.path], set: { views: sql`${pageViews.views} + 1` } });
  return { recorded: true };
});
