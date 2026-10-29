import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { requireSuperAdmin } from '~/server/utils/auth';
import { addGithubCredential } from '~/server/utils/aiProviders';

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  apiKey: z.string().trim().min(20).max(500),
});

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Donne un nom (1 à 60 caractères) et un jeton GitHub valide.' });
  const accounts = await addGithubCredential(parsed.data.name, parsed.data.apiKey);
  return { saved: true, accounts };
});
