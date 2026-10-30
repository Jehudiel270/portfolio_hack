import { defineEventHandler, getHeader, getRequestURL, readBody } from 'h3';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDatabase, databaseIsConfigured } from '~/server/utils/database';
import { analyticsEvents, pageViews } from '~/server/utils/schema';

const schema = z.object({
  path: z.string().max(120),
  event: z.enum(['page_view', 'outbound_click', 'contact_start', 'form_submit']).default('page_view'),
});
const publicPaths = new Set(['/', '/parcours', '/projets', '/competences', '/ia', '/realisations', '/certifications', '/temoignages', '/contact', '/confidentialite']);

function normalizePath(rawPath: string) {
  const raw = rawPath.split('?')[0].split('#')[0];
  return publicPaths.has(raw) ? raw : /^\/projets\/[a-z0-9-]+$/.test(raw) ? '/projets/:slug' : null;
}

function classifySource(referer: string | undefined, currentHost: string) {
  if (!referer) return 'direct';
  let hostname = '';
  try { hostname = new URL(referer).hostname.toLowerCase(); } catch { return 'external'; }
  if (hostname === currentHost.toLowerCase()) return 'internal';
  if (/(^|\.)((google|bing|duckduckgo|yahoo)\.)/.test(hostname)) return 'search';
  if (/(^|\.)((facebook|instagram|linkedin|tiktok|x|twitter)\.)/.test(hostname)) return 'social';
  return 'external';
}

function classifyDevice(userAgent: string | undefined) {
  const value = userAgent || '';
  if (/bot|crawler|spider|slurp/i.test(value)) return 'bot';
  if (/ipad|tablet|kindle|playbook/i.test(value)) return 'tablet';
  if (/mobile|iphone|ipod|android/i.test(value)) return 'mobile';
  return value ? 'desktop' : 'unknown';
}

export default defineEventHandler(async (event) => {
  if (!databaseIsConfigured()) return { recorded: false };
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) return { recorded: false };
  const path = normalizePath(parsed.data.path);
  if (!path || path.startsWith('/admin')) return { recorded: false };
  const day = new Date().toISOString().slice(0, 10);
  const database = getDatabase();
  if (parsed.data.event === 'page_view') {
    await database.insert(pageViews).values({ day, path, views: 1 })
      .onConflictDoUpdate({ target: [pageViews.day, pageViews.path], set: { views: sql`${pageViews.views} + 1` } });
  }
  await database.insert(analyticsEvents).values({
    day,
    path,
    event: parsed.data.event,
    source: classifySource(getHeader(event, 'referer'), getRequestURL(event).hostname),
    device: classifyDevice(getHeader(event, 'user-agent')),
    count: 1,
  }).onConflictDoUpdate({
    target: [analyticsEvents.day, analyticsEvents.path, analyticsEvents.event, analyticsEvents.source, analyticsEvents.device],
    set: { count: sql`${analyticsEvents.count} + 1` },
  });
  return { recorded: true };
});
