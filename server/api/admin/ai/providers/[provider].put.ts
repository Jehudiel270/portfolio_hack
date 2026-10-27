import { createError, defineEventHandler, getRouterParam, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { useRuntimeConfig } from '#imports';
import { z } from 'zod';
import { AI_PROVIDER_DETAILS } from '~/shared/adminAi';
import { encryptProviderKey, isAiProvider } from '~/server/utils/aiProviders';
import { requireSuperAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { aiProviderCredentials } from '~/server/utils/schema';

const schema = z.object({
  apiKey: z.string().trim().max(500).optional(),
  model: z.string().trim().min(1).max(120),
});

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const provider = getRouterParam(event, 'provider') || '';
  if (!isAiProvider(provider)) throw createError({ statusCode: 404, statusMessage: 'Fournisseur IA inconnu.' });
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Clé ou modèle invalide.' });
  const { apiKey, model } = parsed.data;
  if (!/^[a-zA-Z0-9._:/-]{1,120}$/u.test(model)) throw createError({ statusCode: 400, statusMessage: 'Le nom du modèle contient des caractères non autorisés.' });
  const [existing] = await getDatabase().select({ provider: aiProviderCredentials.provider })
    .from(aiProviderCredentials).where(eq(aiProviderCredentials.provider, provider)).limit(1);
  const environmentGeminiKey = provider === 'gemini' ? String(useRuntimeConfig(event).geminiApiKey || '').trim() : '';
  if (!apiKey && !existing && !environmentGeminiKey) throw createError({ statusCode: 400, statusMessage: 'Saisis une clé avant d’enregistrer ce fournisseur.' });
  if (provider === 'github' && apiKey && apiKey.length < 20) throw createError({ statusCode: 400, statusMessage: 'Le jeton GitHub semble trop court.' });
  if (provider !== 'github' && apiKey && apiKey.length < 16) throw createError({ statusCode: 400, statusMessage: 'La clé API semble trop courte.' });
  if (provider === 'github' && model !== AI_PROVIDER_DETAILS.github.defaultModel) {
    throw createError({ statusCode: 400, statusMessage: 'Le modèle GitHub est défini par l’API officielle et ne peut pas être modifié.' });
  }
  const keyToEncrypt = apiKey || (!existing ? environmentGeminiKey : '');
  const encryptedKey = keyToEncrypt ? encryptProviderKey(keyToEncrypt) : null;
  if (existing) {
    await getDatabase().update(aiProviderCredentials)
      .set({ ...(encryptedKey ? { encryptedKey } : {}), model, updatedAt: new Date() })
      .where(eq(aiProviderCredentials.provider, provider));
  } else {
    await getDatabase().insert(aiProviderCredentials).values({ provider, encryptedKey: encryptedKey!, model });
  }
  return { saved: true, provider, model };
});
