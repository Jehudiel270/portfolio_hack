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
      ],
    },
  },
  modules: [],
  runtimeConfig: {
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
