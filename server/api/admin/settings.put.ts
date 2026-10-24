import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { defaultPublicBackgroundSettings } from '~/composables/usePortfolioData';
import { requireAdmin } from '~/server/utils/auth';
import { defaultPublicSiteSettings, readSiteSetting, writeSiteSetting } from '~/server/utils/siteSettings';

const schema = z.object({
  public: z.object({
    visiblePages: z.record(z.string(), z.boolean()),
    appointmentUrl: z.union([z.string().url().max(1200), z.literal(''), z.null()]),
    cvUrl: z.union([z.string().url().max(1200), z.literal(''), z.null()]),
    missionTypes: z.array(z.string().trim().min(1).max(80)).max(12),
    background: z.object({
      showImage: z.boolean(),
      showAmbient: z.boolean(),
      showMaze: z.boolean(),
      ambientIntensity: z.coerce.number().min(0).max(100),
      mazeIntensity: z.coerce.number().min(0).max(100),
      speed: z.coerce.number().min(0.5).max(2),
    }).optional(),
  }),
  contactRetentionDays: z.coerce.number().int().min(30).max(3650),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Paramètres invalides.', message: 'Vérifie les durées, liens et options de visibilité.' });
  const publicSettings = {
    ...defaultPublicSiteSettings,
    ...parsed.data.public,
    visiblePages: { ...defaultPublicSiteSettings.visiblePages, ...parsed.data.public.visiblePages },
    appointmentUrl: parsed.data.public.appointmentUrl || null,
    cvUrl: parsed.data.public.cvUrl || null,
    background: { ...defaultPublicBackgroundSettings, ...parsed.data.public.background },
  };
  await Promise.all([
    writeSiteSetting('public', publicSettings),
    writeSiteSetting('contact_retention_days', parsed.data.contactRetentionDays),
  ]);
  return { public: publicSettings, contactRetentionDays: parsed.data.contactRetentionDays };
});
