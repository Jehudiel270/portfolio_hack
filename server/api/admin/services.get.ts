import { defineEventHandler } from 'h3';
import { sql } from 'drizzle-orm';
import * as nodemailer from 'nodemailer';
import { useRuntimeConfig } from '#imports';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const config = useRuntimeConfig();
  let database: 'ok' | 'error' = 'ok';
  try { await getDatabase().execute(sql`select 1`); } catch (error) {
    database = 'error';
    console.warn('[Admin] Database health check failed.', error);
  }
  const smtpConfigured = Boolean(config.smtpHost && config.smtpPort && config.smtpUser && config.smtpPassword && config.smtpFrom);
  let smtp: 'not_configured' | 'ok' | 'error' = smtpConfigured ? 'error' : 'not_configured';
  if (smtpConfigured) {
    const port = Number(config.smtpPort);
    if (Number.isInteger(port) && port > 0 && port <= 65535) {
      const secure = String(config.smtpSecure) === 'true';
      const transporter = nodemailer.createTransport({
        host: String(config.smtpHost), port, secure, requireTLS: !secure && port === 587,
        auth: { user: String(config.smtpUser), pass: String(config.smtpPassword) },
        connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000,
      });
      try { await transporter.verify(); smtp = 'ok'; }
      catch (error) { console.warn('[Admin] SMTP connectivity check failed.', error); }
    }
  }
  return {
    database,
    smtp,
    cloudinaryConfigured: Boolean(config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret),
    checkedAt: new Date().toISOString(),
  };
});
