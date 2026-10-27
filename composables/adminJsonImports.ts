import type { ProjectMetric } from './usePortfolioData';

export type SkillImportRow = {
  index: number;
  name: string;
  category: string;
  level: number;
  icon: string;
  error: string;
  duplicate: boolean;
};

const metricKeys = ['label', 'value', 'context', 'unit', 'period', 'source', 'evidenceUrl'];
const optionalMetricKeys = ['context', 'unit', 'period', 'source', 'evidenceUrl'] as const;
const skillKeys = ['name', 'category', 'level', 'icon'];

export const metricJsonExamples = {
  minimal: [
    { label: 'Pages réalisées', value: '8', context: 'Pages publiques livrées' },
  ],
  detailed: [
    {
      label: 'Score Lighthouse',
      value: '96',
      unit: '/100',
      period: 'Test du 15/03/2026',
      context: 'Page d’accueil, catégorie Performance',
      source: 'Rapport PageSpeed Insights',
      evidenceUrl: 'https://pagespeed.web.dev/',
    },
  ],
};

export const skillJsonExample = [
  { name: 'TypeScript', category: 'Langages', level: 85, icon: 'logos:typescript-icon' },
  { name: 'Nuxt', category: 'Frameworks', level: 80, icon: 'logos:nuxt-icon' },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unknownKeys(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).filter((key) => !allowed.includes(key));
}

export function parseProjectMetricsJson(text: string): { data?: ProjectMetric[]; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { error: error instanceof Error ? `JSON invalide : ${error.message}` : 'JSON invalide.' };
  }
  if (!Array.isArray(parsed)) return { error: 'Le JSON doit être un tableau de métriques.' };
  if (parsed.length > 12) return { error: 'Un projet peut contenir au maximum 12 métriques.' };

  const metrics: ProjectMetric[] = [];
  for (const [index, item] of parsed.entries()) {
    const position = `Métrique ${index + 1}`;
    if (!isRecord(item)) return { error: `${position} : un objet JSON est attendu.` };
    const extra = unknownKeys(item, metricKeys);
    if (extra.length) return { error: `${position} : champ(s) inconnu(s) : ${extra.join(', ')}.` };
    if (typeof item.label !== 'string' || !item.label.trim() || item.label.length > 80) {
      return { error: `${position} : « label » doit contenir 1 à 80 caractères.` };
    }
    if (typeof item.value !== 'string' || !item.value.trim() || item.value.length > 100) {
      return { error: `${position} : « value » doit contenir 1 à 100 caractères.` };
    }
    const metric: ProjectMetric = { label: item.label.trim(), value: item.value.trim() };
    for (const key of optionalMetricKeys) {
      const rawValue = item[key];
      const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
      if (value !== undefined && value !== '' && typeof value !== 'string') {
        return { error: `${position} : « ${key} » doit être du texte.` };
      }
      if (typeof value === 'string') {
        const maxLength = key === 'context' || key === 'source' ? 300 : key === 'period' ? 80 : key === 'unit' ? 40 : 1200;
        if (value.length > maxLength) return { error: `${position} : « ${key} » dépasse ${maxLength} caractères.` };
        if (value) metric[key] = value;
      }
    }
    if (typeof item.evidenceUrl === 'string' && item.evidenceUrl.trim()) {
      try {
        const url = new URL(item.evidenceUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        return { error: `${position} : « evidenceUrl » doit être une URL http(s) valide.` };
      }
    }
    metrics.push(metric);
  }
  return { data: metrics };
}

export function parseSkillImportJson(text: string, existingNames: string[]): { rows?: SkillImportRow[]; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { error: error instanceof Error ? `JSON invalide : ${error.message}` : 'JSON invalide.' };
  }
  if (!Array.isArray(parsed)) return { error: 'Le JSON doit être un tableau de compétences.' };
  if (parsed.length > 100) return { error: 'Un import JSON est limité à 100 compétences à la fois.' };

  const seen = new Set(existingNames.map((name) => name.trim().toLocaleLowerCase('fr')));
  const rows: SkillImportRow[] = [];
  for (const [index, item] of parsed.entries()) {
    const rowIndex = index + 1;
    if (!isRecord(item)) {
      rows.push({ index: rowIndex, name: '', category: '', level: 75, icon: '', error: 'Un objet JSON est attendu.', duplicate: false });
      continue;
    }
    const extra = unknownKeys(item, skillKeys);
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const category = typeof item.category === 'string' && item.category.trim() ? item.category.trim() : 'Full Stack';
    const level = item.level === undefined ? 75 : item.level;
    const icon = item.icon === undefined ? '' : item.icon;
    const errors: string[] = [];
    if (extra.length) errors.push(`Champ(s) inconnu(s) : ${extra.join(', ')}.`);
    if (!name) errors.push('Nom obligatoire.');
    if (name.length > 120) errors.push('Nom trop long.');
    if (typeof item.category !== 'undefined' && typeof item.category !== 'string') errors.push('La catégorie doit être du texte.');
    if (category.length > 80) errors.push('Catégorie trop longue.');
    if (typeof level !== 'number' || !Number.isInteger(level) || level < 0 || level > 100) errors.push('Niveau attendu : entier 0–100.');
    if (typeof icon !== 'string') errors.push('L’icône doit être du texte.');
    if (typeof icon === 'string' && icon.length > 120) errors.push('Icône trop longue.');
    const normalizedName = name.toLocaleLowerCase('fr');
    const duplicate = Boolean(normalizedName && seen.has(normalizedName));
    if (normalizedName) seen.add(normalizedName);
    rows.push({ index: rowIndex, name, category, level: typeof level === 'number' ? level : 75, icon: typeof icon === 'string' ? icon : '', error: errors.join(' '), duplicate });
  }
  return { rows };
}
