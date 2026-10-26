import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  compatibilityDate: "2025-06-01",
  devtools: { enabled: false },
  app: {
    pageTransition: { name: 'route', mode: 'out-in' },
    head: {
      title: 'Carrel DOSSOU — Développeur Full Stack',
      htmlAttrs: { lang: 'fr' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/brandmark.svg' },
        { rel: 'stylesheet', href: '/portfolio.css' },
        { rel: 'stylesheet', href: '/portfolio-enhancements.css' },
        { rel: 'preconnect', href: 'https://api.iconify.design' },
      ],
    },
  },
  modules: [],
  hooks: {
    'pages:extend'(pages) {
      const role = process.env.NUXT_APP_ROLE || (process.env.NODE_ENV === 'development' ? 'all' : 'public');
      if (role === 'all') return;
      const isAdminRoute = (path: string) => path === '/admin' || path.startsWith('/admin/');
      pages.splice(0, pages.length, ...pages.filter((page) => role === 'admin' ? isAdminRoute(page.path) : !isAdminRoute(page.path)));
    },
  },
  runtimeConfig: {
    appRole: process.env.NUXT_APP_ROLE || (process.env.NODE_ENV === 'development' ? 'all' : 'public'),
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || "",
    databaseUrl: process.env.DATABASE_URL || "",
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
    smtpHost: process.env.SMTP_HOST || "",
    smtpPort: process.env.SMTP_PORT || "",
    smtpSecure: process.env.SMTP_SECURE || "false",
    smtpUser: process.env.SMTP_USER || "",
    smtpPassword: process.env.SMTP_PASSWORD || "",
    smtpFrom: process.env.SMTP_FROM || "",
    contactFallbackTo: process.env.CONTACT_FALLBACK_TO || "",
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "",
    },
  },
  typescript: { strict: true, typeCheck: true },
});
