import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { addProviderUsage, generateGeminiImage, generateOpenAiImage, generateStabilityImage, getProviderCredential, listGeminiCredentials } from '~/server/utils/aiProviders';
import { enforceAiRequestLimit } from '~/server/utils/aiRateLimit';
import { requireAdmin } from '~/server/utils/auth';

const schema = z.object({
  prompt: z.string().trim().min(20).max(1200),
  consent: z.literal(true),
  provider: z.enum(['openai', 'gemini', 'stability']).default('openai'),
});

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Confirme l’envoi à OpenAI et décris la couverture à générer.' });
  const provider = parsed.data.provider;
  enforceAiRequestLimit(admin.id, 'image', 5);
  let image: string;
  let model: string;
  if (provider === 'openai') {
    const credential = await getProviderCredential('openai');
    if (!credential) throw createError({ statusCode: 503, statusMessage: 'Configure une clé OpenAI dans IA & modèles pour générer une image.' });
    image = await generateOpenAiImage(credential.apiKey, parsed.data.prompt);
    model = 'gpt-image-1';
  } else if (provider === 'gemini') {
    const accounts = await listGeminiCredentials();
    const credential = await getProviderCredential('gemini');
    const keys = accounts.length ? accounts.map(account => account.apiKey) : credential ? [credential.apiKey] : [];
    if (!keys.length) throw createError({ statusCode: 503, statusMessage: 'Configure une clé Gemini dans IA & modèles pour générer une image.' });
    let lastError: unknown;
    image = '';
    for (const apiKey of keys) {
      try { image = await generateGeminiImage(apiKey, parsed.data.prompt); break; }
      catch (error) { lastError = error; }
    }
    if (!image) throw lastError || createError({ statusCode: 502, statusMessage: 'Toutes les clés Gemini Images sont indisponibles.' });
    model = 'imagen-4.0-generate-001';
  } else {
    const credential = await getProviderCredential('stability');
    if (!credential) throw createError({ statusCode: 503, statusMessage: 'Configure une clé Stability AI dans IA & modèles pour générer une image.' });
    image = await generateStabilityImage(credential.apiKey, parsed.data.prompt);
    model = 'stable-image-ultra';
  }
  await addProviderUsage(provider);
  return { image, model, target: { width: 1200, height: 675 } };
});
