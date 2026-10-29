import { defineEventHandler } from 'h3';
import { requireAdmin } from '~/server/utils/auth';
import { listGeminiCredentials } from '~/server/utils/aiProviders';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  return (await listGeminiCredentials()).map(({ id, name }) => ({ id, name }));
});
