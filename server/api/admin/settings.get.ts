import { defineEventHandler } from 'h3';
import { requireAdmin } from '~/server/utils/auth';
import { readPublicSiteSettings, readSiteSetting } from '~/server/utils/siteSettings';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  return {
    public: await readPublicSiteSettings(),
    contactRetentionDays: await readSiteSetting('contact_retention_days', 365),
  };
});
