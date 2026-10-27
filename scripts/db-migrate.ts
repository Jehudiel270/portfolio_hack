import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import postgres from 'postgres';
import { SUPER_ADMIN_EMAIL } from '../shared/adminPermissions';

const url = process.env.DATABASE_URL || '';
if (!url) throw new Error('DATABASE_URL doit être configurée avant les migrations.');

const sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 10, prepare: false });
try {
  for (const name of ['0001_portfolio.sql', '0002_portfolio_content_expansion.sql', '0003_profile_social_links.sql', '0004_education_certifications.sql', '0005_ai_catalog_metadata.sql', '0006_projects_testimonials.sql', '0007_admin_operations.sql', '0008_ai_usage_metadata.sql', '0009_admin_totp.sql', '0010_admin_permissions.sql', '0011_project_metrics_and_layout.sql', '0012_admin_display_names.sql', '0013_ai_providers_and_analytics.sql']) {
    if (name === '0010_admin_permissions.sql') {
      const [owner] = await sql`select id from portfolio_admins where lower(email) = ${SUPER_ADMIN_EMAIL} limit 1`;
      if (!owner) throw new Error(`Le compte super-administrateur ${SUPER_ADMIN_EMAIL} doit exister avant la migration des permissions.`);
    }
    const migration = await readFile(resolve('drizzle', name), 'utf8');
    for (const statement of migration.split(';').map((part) => part.trim()).filter(Boolean)) {
      await sql.unsafe(statement);
    }
    console.log(`Migration appliquée : ${name}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
