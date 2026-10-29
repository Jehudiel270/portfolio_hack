import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { addGeminiCredential } from '~/server/utils/aiProviders';
import { requireSuperAdmin } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const parsed = z.object({ name: z.string().trim().min(1).max(60), apiKey: z.string().trim().min(16).max(500) }).safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Nom ou clé Gemini invalide.' });
  const accounts = await addGeminiCredential(parsed.data.name, parsed.data.apiKey);
  return { accounts };
});
