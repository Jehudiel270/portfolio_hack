import { sql } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import type { SocialLink } from '~/composables/socialNetworks';

export const admins = pgTable('portfolio_admins', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  displayName: varchar('display_name', { length: 120 }).notNull().default(''),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 24 }).notNull().default('admin'),
  active: boolean('active').notNull().default(true),
  permissions: jsonb('permissions').$type<Record<string, boolean>>().notNull().default(sql`'{}'::jsonb`),
  sessionVersion: integer('session_version').notNull().default(0),
  totpSecretCiphertext: text('totp_secret_ciphertext'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
  recoveryCodeHashes: jsonb('recovery_code_hashes').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const adminLoginAttempts = pgTable('portfolio_admin_login_attempts', {
  ipHash: varchar('ip_hash', { length: 64 }).primaryKey(),
  attempts: integer('attempts').notNull().default(0),
  windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull().defaultNow(),
});
export const profiles = pgTable('portfolio_profile', {
  id: integer('id').primaryKey().default(1),
  name: varchar('name', { length: 120 }).notNull(),
  role: varchar('role', { length: 180 }).notNull(),
  location: varchar('location', { length: 120 }).notNull().default('Bénin'),
  education: varchar('education', { length: 180 }).notNull().default(''),
  bio: text('bio').notNull().default(''),
  avatarUrl: text('avatar_url'),
  email: varchar('email', { length: 320 }),
  githubUrl: text('github_url'),
  linkedinUrl: text('linkedin_url'),
  socialLinks: jsonb('social_links').$type<SocialLink[]>().notNull().default(sql`'[]'::jsonb`),
  available: boolean('available').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
export const projects = pgTable('portfolio_projects', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 160 }).notNull(),
  slug: varchar('slug', { length: 180 }).notNull(),
  description: text('description').notNull(),
  tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
  categories: text('categories').array().notNull().default(sql`ARRAY[]::text[]`),
  demoUrl: text('demo_url'), repoUrl: text('repo_url'), imageUrl: text('image_url'),
  year: varchar('year', { length: 12 }),
  projectType: varchar('project_type', { length: 60 }).notNull().default('Web'),
  caseRole: varchar('case_role', { length: 180 }),
  caseContext: text('case_context'),
  responsibilities: text('responsibilities').array().notNull().default(sql`ARRAY[]::text[]`),
  outcomes: text('outcomes'),
  metrics: jsonb('metrics').$type<{ label: string; value: string; context?: string; unit?: string; period?: string; source?: string; evidenceUrl?: string }[]>().notNull().default(sql`'[]'::jsonb`),
  caseLayout: jsonb('case_layout').$type<{ accentColor?: string; layout?: 'standard' | 'editorial'; showRole?: boolean; showContext?: boolean; showResponsibilities?: boolean; showOutcomes?: boolean; showMetrics?: boolean; showGallery?: boolean }>(),
  gallery: jsonb('gallery').$type<{ url: string; alt: string; caption: string; sortOrder: number }[]>().notNull().default(sql`'[]'::jsonb`),
  publicationStatus: varchar('publication_status', { length: 20 }).notNull().default('published'),
  publishAt: timestamp('publish_at', { withTimezone: true }),
  featured: boolean('featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ slugUnique: uniqueIndex('portfolio_projects_slug_unique').on(table.slug) }));
export const journey = pgTable('portfolio_journey', {
  id: serial('id').primaryKey(), role: varchar('role', { length: 180 }).notNull(),
  organization: varchar('organization', { length: 180 }).notNull(), location: varchar('location', { length: 120 }),
  startDate: varchar('start_date', { length: 32 }).notNull(), endDate: varchar('end_date', { length: 32 }),
  description: text('description').notNull(), imageUrl: text('image_url'), documentUrl: text('document_url'),
  documentPublic: boolean('document_public').notNull().default(false), publicationStatus: varchar('publication_status', { length: 20 }).notNull().default('published'),
  sortOrder: integer('sort_order').notNull().default(0),
});
export const educations = pgTable('portfolio_educations', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 180 }).notNull(),
  institution: varchar('institution', { length: 180 }).notNull(),
  degree: varchar('degree', { length: 180 }).notNull().default(''),
  location: varchar('location', { length: 120 }),
  startDate: varchar('start_date', { length: 32 }).notNull(),
  endDate: varchar('end_date', { length: 32 }),
  status: varchar('status', { length: 20 }).notNull().default('completed'),
  description: text('description').notNull().default(''),
  imageUrl: text('image_url'),
  documentUrl: text('document_url'),
  documentPublic: boolean('document_public').notNull().default(false),
  publicationStatus: varchar('publication_status', { length: 20 }).notNull().default('published'),
  sortOrder: integer('sort_order').notNull().default(0),
});
export const certifications = pgTable('portfolio_certifications', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 180 }).notNull(),
  issuer: varchar('issuer', { length: 180 }).notNull(),
  issuedAt: varchar('issued_at', { length: 32 }),
  expiresAt: varchar('expires_at', { length: 32 }),
  credentialId: varchar('credential_id', { length: 180 }),
  credentialUrl: text('credential_url'),
  skills: text('skills').array().notNull().default(sql`ARRAY[]::text[]`),
  description: text('description').notNull().default(''),
  imageUrl: text('image_url'),
  documentUrl: text('document_url'),
  documentPublic: boolean('document_public').notNull().default(false),
  publicationStatus: varchar('publication_status', { length: 20 }).notNull().default('published'),
  sortOrder: integer('sort_order').notNull().default(0),
});
export const achievements = pgTable('portfolio_achievements', {
  id: serial('id').primaryKey(), title: varchar('title', { length: 180 }).notNull(),
  description: text('description').notNull(), date: varchar('date', { length: 32 }), icon: varchar('icon', { length: 60 }).notNull().default('Sparkles'),
  sortOrder: integer('sort_order').notNull().default(0),
});
export const testimonials = pgTable('portfolio_testimonials', {
  id: serial('id').primaryKey(),
  author: varchar('author', { length: 140 }).notNull(),
  role: varchar('role', { length: 180 }),
  organization: varchar('organization', { length: 180 }),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
  sourceUrl: text('source_url'),
  receivedAt: varchar('received_at', { length: 32 }),
  quote: text('quote').notNull(),
  permissionConfirmed: boolean('permission_confirmed').notNull().default(false),
  publicationStatus: varchar('publication_status', { length: 20 }).notNull().default('draft'),
  sortOrder: integer('sort_order').notNull().default(0),
});
export const skills = pgTable('portfolio_skills', {
  id: serial('id').primaryKey(), name: varchar('name', { length: 120 }).notNull(),
  icon: varchar('icon', { length: 120 }).notNull().default(''),
  level: integer('level').notNull().default(70), category: varchar('category', { length: 80 }).notNull().default('Full Stack'),
  sortOrder: integer('sort_order').notNull().default(0),
});
export const technologies = pgTable('portfolio_technologies', {
  id: serial('id').primaryKey(), name: varchar('name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 80 }).notNull().default(''), category: varchar('category', { length: 80 }).notNull().default('Frontend'),
  aiType: varchar('ai_type', { length: 24 }),
  aiProviderId: integer('ai_provider_id').references((): AnyPgColumn => technologies.id, { onDelete: 'set null' }),
  aiAccessMode: varchar('ai_access_mode', { length: 20 }),
  aiUseCases: text('ai_use_cases').array().notNull().default(sql`ARRAY[]::text[]`),
  aiVerifiedAt: varchar('ai_verified_at', { length: 32 }),
  description: text('description'),
  officialUrl: text('official_url'),
  sortOrder: integer('sort_order').notNull().default(0),
});
export const contactMessages = pgTable('portfolio_contact_messages', {
  id: serial('id').primaryKey(), name: varchar('name', { length: 120 }).notNull(),
  email: varchar('email', { length: 320 }).notNull(), subject: varchar('subject', { length: 180 }).notNull().default(''),
  message: text('message').notNull(), deliveryStatus: varchar('delivery_status', { length: 30 }).notNull().default('received'),
  processingStatus: varchar('processing_status', { length: 20 }).notNull().default('new'),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const siteSettings = pgTable('portfolio_settings', {
  key: varchar('key', { length: 80 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
export const activityLog = pgTable('portfolio_activity_log', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 24 }).notNull(),
  resource: varchar('resource', { length: 80 }).notNull(),
  resourceId: integer('resource_id'),
  summary: varchar('summary', { length: 240 }).notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const pageViews = pgTable('portfolio_page_views', {
  day: varchar('day', { length: 10 }).notNull(),
  path: varchar('path', { length: 120 }).notNull(),
  views: integer('views').notNull().default(0),
}, (table) => ({ dailyPath: uniqueIndex('portfolio_page_views_day_path_unique').on(table.day, table.path) }));
export const analyticsEvents = pgTable('portfolio_analytics_events', {
  day: varchar('day', { length: 10 }).notNull(),
  path: varchar('path', { length: 120 }).notNull(),
  event: varchar('event', { length: 40 }).notNull(),
  source: varchar('source', { length: 40 }).notNull().default('direct'),
  device: varchar('device', { length: 16 }).notNull().default('unknown'),
  count: integer('count').notNull().default(0),
}, (table) => ({ dailyEvent: uniqueIndex('portfolio_analytics_events_daily_unique').on(table.day, table.path, table.event, table.source, table.device) }));
export const aiProviderCredentials = pgTable('portfolio_ai_provider_credentials', {
  provider: varchar('provider', { length: 24 }).primaryKey(),
  encryptedKey: text('encrypted_key').notNull(),
  model: varchar('model', { length: 120 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
export const aiProviderUsage = pgTable('portfolio_ai_provider_usage', {
  day: varchar('day', { length: 10 }).notNull(),
  provider: varchar('provider', { length: 24 }).notNull(),
  requests: integer('requests').notNull().default(0),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
}, (table) => ({ dailyProvider: uniqueIndex('portfolio_ai_provider_usage_daily_unique').on(table.day, table.provider) }));
export const portfolioSchema = { admins, profiles, projects, journey, educations, certifications, achievements, testimonials, skills, technologies, contactMessages, siteSettings, activityLog, pageViews, analyticsEvents, aiProviderCredentials, aiProviderUsage };
