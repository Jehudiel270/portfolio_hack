import { createError, defineEventHandler, getRequestURL, sendRedirect } from 'h3';
import { useRuntimeConfig } from '#imports';

const sharedAssets = ['/_nuxt/', '/portfolio.css', '/portfolio-enhancements.css', '/brandmark.svg', '/images/'];

export default defineEventHandler((event) => {
  const role = String(useRuntimeConfig().appRole || 'public');
  if (role === 'all') return;

  const pathname = getRequestURL(event).pathname;
  if (role === 'public') {
    if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/api/admin' || pathname.startsWith('/api/admin/')) {
      throw createError({ statusCode: 404, statusMessage: 'Page introuvable.' });
    }
    return;
  }

  if (role !== 'admin') throw createError({ statusCode: 404, statusMessage: 'Page introuvable.' });
  if (pathname === '/') return sendRedirect(event, '/admin', 302);

  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname === '/api/admin' || pathname.startsWith('/api/admin/');
  const isAdminSupportApi = pathname === '/api/technology-catalog';
  const isSharedAsset = sharedAssets.some((asset) => pathname.startsWith(asset));
  if (!isAdminPage && !isAdminApi && !isAdminSupportApi && !isSharedAsset) {
    throw createError({ statusCode: 404, statusMessage: 'Page introuvable.' });
  }
});
