import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { addProviderUsage, captureSiteScreenshot, getProviderCredential } from '~/server/utils/aiProviders';
import { enforceAiRequestLimit } from '~/server/utils/aiRateLimit';
import { requireAdmin } from '~/server/utils/auth';
import { validatePublicHttpsUrl } from '~/server/utils/publicWebUrl';

const schema = z.object({
  url: z.string().trim().min(1).max(2048),
  mode: z.enum(['desktop', 'mobile', 'fullpage']),
  consent: z.literal(true),
});

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Confirme le partage de l’URL publique et sélectionne un format de capture.' });
  const url = await validatePublicHttpsUrl(parsed.data.url);
  const credential = await getProviderCredential('screenshotone');
  if (!credential) throw createError({ statusCode: 503, statusMessage: 'Configure une clé ScreenshotOne dans IA & modèles pour capturer un site.' });
  enforceAiRequestLimit(admin.id, 'site-capture', 10);
  const image = await captureSiteScreenshot(credential.apiKey, url, parsed.data.mode);
  await addProviderUsage('screenshotone');
  return new Response(new Uint8Array(image), {
    headers: {
      'content-type': 'image/jpeg',
      'content-length': String(image.byteLength),
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
});
