import { defineEventHandler } from 'h3';
import { listProviderUsage } from '~/server/utils/aiProviders';
import { requireAdmin } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  return listProviderUsage();
});
