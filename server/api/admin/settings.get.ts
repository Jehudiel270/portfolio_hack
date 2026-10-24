import { defineEventHandler } from 'h3';
import { requireAdmin } from '~/server/utils/auth';
import { readSiteSetting, defaultPublicSiteSettings } from '~/server/utils/siteSettings';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  return {
    public: await readSiteSetting('public', defaultPublicSiteSettings),
    contactRetentionDays: await readSiteSetting('contact_retention_days', 365),
  };
});
