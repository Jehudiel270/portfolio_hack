import { eq } from 'drizzle-orm';
import { defaultPublicBackgroundSettings, type PublicSiteSettings } from '~/composables/usePortfolioData';
import { getDatabase } from './database';
import { siteSettings } from './schema';

export type { PublicSiteSettings } from '~/composables/usePortfolioData';

export const defaultPublicSiteSettings: PublicSiteSettings = {
  visiblePages: {
    parcours: true, projets: true, competences: true, ia: true,
    certifications: true, contact: true,
  },
  appointmentUrl: null,
  cvUrl: null,
  missionTypes: [],
  background: defaultPublicBackgroundSettings,
};

export async function readSiteSetting<T>(key: string, fallback: T): Promise<T> {
  const [setting] = await getDatabase().select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return (setting?.value as T | undefined) ?? fallback;
}

export async function readPublicSiteSettings(): Promise<PublicSiteSettings> {
  const stored = await readSiteSetting('public', defaultPublicSiteSettings);
  const visiblePages = { ...defaultPublicSiteSettings.visiblePages, ...stored.visiblePages };
  delete visiblePages.realisations;
  return {
    ...defaultPublicSiteSettings,
    ...stored,
    visiblePages,
    background: { ...defaultPublicBackgroundSettings, ...stored.background },
  };
}

export async function writeSiteSetting(key: string, value: unknown) {
  await getDatabase().insert(siteSettings).values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}
