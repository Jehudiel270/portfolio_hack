import { createError, defineEventHandler, getRouterParam } from 'h3';
import { removeGeminiCredential } from '~/server/utils/aiProviders';
import { requireSuperAdmin } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const id = getRouterParam(event, 'id') || '';
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Compte Gemini invalide.' });
  return { accounts: await removeGeminiCredential(id) };
});
