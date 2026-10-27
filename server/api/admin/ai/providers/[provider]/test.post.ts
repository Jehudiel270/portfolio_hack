import { createError, defineEventHandler, getRouterParam } from 'h3';
import { checkProviderCredential, getProviderCredential, isAiProvider } from '~/server/utils/aiProviders';
import { requireSuperAdmin } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const provider = getRouterParam(event, 'provider') || '';
  if (!isAiProvider(provider)) throw createError({ statusCode: 404, statusMessage: 'Fournisseur IA inconnu.' });
  const credential = await getProviderCredential(provider);
  if (!credential) throw createError({ statusCode: 400, statusMessage: 'Aucune clé enregistrée pour ce fournisseur.' });
  const result = await checkProviderCredential(provider, credential.apiKey);
  return { ...result, provider, checkedAt: new Date().toISOString() };
});
