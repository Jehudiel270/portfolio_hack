import { createError, defineEventHandler, getRouterParam } from 'h3';
import { eq } from 'drizzle-orm';
import { isAiProvider } from '~/server/utils/aiProviders';
import { requireSuperAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { aiProviderCredentials } from '~/server/utils/schema';

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const provider = getRouterParam(event, 'provider') || '';
  if (!isAiProvider(provider)) throw createError({ statusCode: 404, statusMessage: 'Fournisseur IA inconnu.' });
  const result = await getDatabase().delete(aiProviderCredentials).where(eq(aiProviderCredentials.provider, provider)).returning({ provider: aiProviderCredentials.provider });
  return { deleted: result.length > 0, provider };
});
