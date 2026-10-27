import { eq } from 'drizzle-orm';
import { defaultFloatingIconSettings, defaultProjectDisplaySettings, defaultPublicBackgroundSettings, defaultRichTextSettings, type PublicSiteSettings } from '~/composables/usePortfolioData';
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
  floatingIcons: defaultFloatingIconSettings,
  technologySlots: [],
  richText: defaultRichTextSettings,
  projectDisplay: defaultProjectDisplaySettings,
};

export async function readSiteSetting<T>(key: string, fallback: T): Promise<T> {
  const [setting] = await getDatabase().select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return (setting?.value as T | undefined) ?? fallback;
}

export async function readPublicSiteSettings(): Promise<PublicSiteSettings> {
  const stored = await readSiteSetting('public', defaultPublicSiteSettings);
  const visiblePages = { ...defaultPublicSiteSettings.visiblePages, ...stored.visiblePages };
  const darkCardOpacity = Number(stored.background?.darkCardOpacity);
  const floatingIconLayer = stored.floatingIcons?.layer;
  const normalizeNumber = (value: unknown, min: number, max: number, fallback: number, integer = false) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    const bounded = Math.min(max, Math.max(min, number));
    return integer ? Math.round(bounded) : Math.round(bounded * 10) / 10;
  };
  const minSize = normalizeNumber(stored.floatingIcons?.minSize, 16, 128, defaultFloatingIconSettings.minSize, true);
  const minDuration = normalizeNumber(stored.floatingIcons?.minDuration, 1, 30, defaultFloatingIconSettings.minDuration);
  const minSpawnIntervalMs = normalizeNumber(stored.floatingIcons?.minSpawnIntervalMs, 250, 20_000, defaultFloatingIconSettings.minSpawnIntervalMs, true);
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
    floatingIcons: {
      ...defaultFloatingIconSettings,
      ...stored.floatingIcons,
      maxIcons: Math.min(16, Math.max(1, Number(stored.floatingIcons?.maxIcons) || defaultFloatingIconSettings.maxIcons)),
      opacity: Math.min(50, Math.max(5, Number(stored.floatingIcons?.opacity) || defaultFloatingIconSettings.opacity)),
      speed: Math.min(2, Math.max(0.5, Number(stored.floatingIcons?.speed) || defaultFloatingIconSettings.speed)),
      layer: floatingIconLayer === 'behind-background' || floatingIconLayer === 'above-background' || floatingIconLayer === 'foreground'
        ? floatingIconLayer
        : defaultFloatingIconSettings.layer,
      minSize,
      maxSize: Math.max(minSize, normalizeNumber(stored.floatingIcons?.maxSize, 16, 128, defaultFloatingIconSettings.maxSize, true)),
      minDuration,
      maxDuration: Math.max(minDuration, normalizeNumber(stored.floatingIcons?.maxDuration, 1, 30, defaultFloatingIconSettings.maxDuration)),
      minSpawnIntervalMs,
      maxSpawnIntervalMs: Math.max(minSpawnIntervalMs, normalizeNumber(stored.floatingIcons?.maxSpawnIntervalMs, 250, 20_000, defaultFloatingIconSettings.maxSpawnIntervalMs, true)),
      maxRotation: normalizeNumber(stored.floatingIcons?.maxRotation, 0, 45, defaultFloatingIconSettings.maxRotation, true),
      floatDistance: normalizeNumber(stored.floatingIcons?.floatDistance, 0, 80, defaultFloatingIconSettings.floatDistance, true),
      icons: Array.isArray(stored.floatingIcons?.icons) ? stored.floatingIcons.icons.slice(0, 30) : defaultFloatingIconSettings.icons,
    },
    technologySlots: Array.isArray(stored.technologySlots) ? stored.technologySlots.slice(0, 3) : [],
    richText: {
      ...defaultRichTextSettings,
      ...stored.richText,
      fields: { ...defaultRichTextSettings.fields, ...stored.richText?.fields },
    },
    projectDisplay: { ...defaultProjectDisplaySettings, ...stored.projectDisplay },
  };
}

export async function writeSiteSetting(key: string, value: unknown) {
  await getDatabase().insert(siteSettings).values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}
