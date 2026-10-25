import { createError, defineEventHandler, getRequestURL } from 'h3';
import { useRuntimeConfig } from '#imports';
import { readPublicSiteSettings } from '~/server/utils/siteSettings';

const pageByPrefix: Record<string, string> = {
  parcours: 'parcours',
  projets: 'projets',
  competences: 'competences',
  ia: 'ia',
  certifications: 'certifications',
  contact: 'contact',
};

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname;
  if (pathname.startsWith('/api/') || pathname.startsWith('/admin') || pathname.startsWith('/_nuxt/') || pathname === '/favicon.ico') return;
  const page = pageByPrefix[pathname.split('/')[1] || ''];
  if (!page || !useRuntimeConfig().databaseUrl) return;
  try {
    const settings = await readPublicSiteSettings();
    if (settings.visiblePages[page] === false) throw createError({ statusCode: 404, statusMessage: 'Cette page n’est pas publiée.' });
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) throw error;
    console.warn('[Site] Could not load page visibility settings; page remains available.', error);
  }
});
