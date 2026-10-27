import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { addProviderUsage, generateOpenAiImage, getProviderCredential } from '~/server/utils/aiProviders';
import { enforceAiRequestLimit } from '~/server/utils/aiRateLimit';
import { requireAdmin } from '~/server/utils/auth';

const schema = z.object({
  prompt: z.string().trim().min(20).max(1200),
  consent: z.literal(true),
});

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Confirme l’envoi à OpenAI et décris la couverture à générer.' });
  const credential = await getProviderCredential('openai');
  if (!credential) throw createError({ statusCode: 503, statusMessage: 'Configure une clé OpenAI dans IA & modèles pour générer une image.' });
  enforceAiRequestLimit(admin.id, 'image', 5);
  const image = await generateOpenAiImage(credential.apiKey, parsed.data.prompt);
  await addProviderUsage('openai');
  return { image, model: 'gpt-image-1', target: { width: 1200, height: 675 } };
});
