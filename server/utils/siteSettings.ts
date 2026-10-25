import { eq } from 'drizzle-orm';
import { defaultPublicBackgroundSettings, type PublicSiteSettings } from '~/composables/usePortfolioData';
import { getDatabase } from './database';
import { siteSettings } from './schema';
import { cloneCinematicIntroSettings, sanitizeCinematicIntroSettings } from '~/types/cinematic-intro';

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
  cinematicIntro: cloneCinematicIntroSettings(),
};

export async function readSiteSetting<T>(key: string, fallback: T): Promise<T> {
  const [setting] = await getDatabase().select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return (setting?.value as T | undefined) ?? fallback;
}

export async function readPublicSiteSettings(): Promise<PublicSiteSettings> {
  const stored = await readSiteSetting('public', defaultPublicSiteSettings);
  const visiblePages = { ...defaultPublicSiteSettings.visiblePages, ...stored.visiblePages };
  const darkCardOpacity = Number(stored.background?.darkCardOpacity);
  delete visiblePages.realisations;
  return {
    ...defaultPublicSiteSettings,
    ...stored,
    visiblePages,
    background: {
      ...defaultPublicBackgroundSettings,
      ...stored.background,
      darkCardOpacity: Number.isInteger(darkCardOpacity)
        ? Math.min(85, Math.max(40, darkCardOpacity))
        : defaultPublicBackgroundSettings.darkCardOpacity,
    },
    // Réglages enregistrés avant cette fonctionnalité : valeurs par défaut ; valeurs invalides : bornées.
    cinematicIntro: sanitizeCinematicIntroSettings(stored.cinematicIntro),
  };
}

export async function writeSiteSetting(key: string, value: unknown) {
  await getDatabase().insert(siteSettings).values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}
