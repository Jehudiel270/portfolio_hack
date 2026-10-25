/**
 * Carrelfolio — Introduction cinématique.
 *
 * Source unique de vérité pour :
 *  - les types des réglages,
 *  - les valeurs par défaut (utilisées par le composant public ET par le Dashboard),
 *  - les limites (utilisées côté client ET côté serveur),
 *  - la normalisation défensive (`sanitizeCinematicIntroSettings`),
 *  - le catalogue audio et les repères de synchronisation du fichier fourni.
 *
 * Ce fichier ne dépend ni de Vue, ni de Nuxt, ni de Node : il est importable partout.
 */

export type CinematicIntroFrequency = 'session' | 'always' | 'first-visit';
export type CinematicIntroFont = 'space-grotesk' | 'dm-mono';
export type CinematicIntroReducedMotion = 'skip' | 'minimal';
export type CinematicIntroAudioPreset = 'short' | 'source' | 'custom';

export interface CinematicIntroPalette {
  background: string;
  text: string;
  cyan: string;
  blue: string;
  violet: string;
  /** Second canal de la séparation RVB (magenta). */
  split: string;
}

export interface CinematicIntroSettings {
  enabled: boolean;
  frequency: CinematicIntroFrequency;
  /** Incrémenter pour que tous les visiteurs revoient l'intro (clé de stockage versionnée). */
  revision: number;
  /** Petit bouton discret « Rejouer l'intro » sur le site (fonctionne aussi si l'intro automatique est désactivée). */
  replayButton: boolean;
  /** Comportement avec prefers-reduced-motion : révélation immédiate ou affichage statique minimal. */
  reducedMotion: CinematicIntroReducedMotion;

  text: string;
  fontFamily: CinematicIntroFont;
  fontWeight: number;
  showSubtitle: boolean;
  subtitle: string;

  durations: {
    lettersMs: number;
    glitchMs: number;
    /** Maintien du nom stabilisé avant la transition CRT. */
    holdMs: number;
    outroMs: number;
  };

  /** Intensités en pourcentage (0–100). */
  effects: {
    glitch: number;
    rgbSplit: number;
    scanlines: number;
    distortion: number;
    flash: number;
  };

  palette: CinematicIntroPalette;

  audio: {
    enabled: boolean;
    /** 0–100 */
    volume: number;
    preset: CinematicIntroAudioPreset;
    /** Chemin public local (ex. /audio/mon-son.mp3), utilisé uniquement si preset === 'custom'. */
    customSrc: string;
  };
}

export const cinematicIntroFrequencies: { value: CinematicIntroFrequency; label: string; hint: string }[] = [
  { value: 'session', label: 'Une fois par session de navigation', hint: 'Mémorisé dans sessionStorage : revient à la prochaine ouverture du navigateur.' },
  { value: 'always', label: 'À chaque chargement complet', hint: 'Jamais lors des navigations internes, uniquement au chargement/rafraîchissement.' },
  { value: 'first-visit', label: 'Uniquement la première visite', hint: 'Mémorisé dans localStorage ; utilise « Faire revoir l’intro » pour réinitialiser.' },
];

export const cinematicIntroFonts: { value: CinematicIntroFont; label: string }[] = [
  { value: 'space-grotesk', label: 'Space Grotesk (police du site)' },
  { value: 'dm-mono', label: 'DM Mono (police technique du site)' },
];

/** Graisses réellement chargées par public/portfolio.css (Space Grotesk 400–700, DM Mono 400–500). */
export const cinematicIntroWeights = [400, 500, 600, 700] as const;

export const cinematicIntroLimits = {
  text: { min: 1, max: 60 },
  subtitle: { max: 80 },
  lettersMs: { min: 300, max: 2500, step: 50 },
  glitchMs: { min: 1200, max: 3500, step: 50 },
  holdMs: { min: 0, max: 1000, step: 20 },
  outroMs: { min: 120, max: 800, step: 10 },
  percent: { min: 0, max: 100, step: 5 },
  volume: { min: 0, max: 100, step: 5 },
  revision: { min: 1, max: 9999 },
} as const;

export const defaultCinematicIntroSettings: CinematicIntroSettings = Object.freeze({
  enabled: true,
  frequency: 'session',
  revision: 1,
  replayButton: false,
  reducedMotion: 'skip',

  text: 'DOSSOU Carrel',
  fontFamily: 'space-grotesk',
  fontWeight: 700,
  showSubtitle: false,
  subtitle: '',

  durations: Object.freeze({ lettersMs: 900, glitchMs: 2000, holdMs: 220, outroMs: 250 }),
  effects: Object.freeze({ glitch: 80, rgbSplit: 75, scanlines: 50, distortion: 70, flash: 35 }),
  palette: Object.freeze({
    background: '#030711',
    text: '#e5f2ff',
    cyan: '#19e6ef',
    blue: '#3588ff',
    violet: '#8a5cff',
    split: '#ff2bd6',
  }),
  audio: Object.freeze({ enabled: true, volume: 65, preset: 'short', customSrc: '' }),
}) as CinematicIntroSettings;

/** Copie profonde modifiable des valeurs par défaut (ne jamais muter l'objet gelé). */
export function cloneCinematicIntroSettings(source: CinematicIntroSettings = defaultCinematicIntroSettings): CinematicIntroSettings {
  return {
    ...source,
    durations: { ...source.durations },
    effects: { ...source.effects },
    palette: { ...source.palette },
    audio: { ...source.audio },
  };
}

/* ------------------------------------------------------------------ */
/* Audio                                                               */
/* ------------------------------------------------------------------ */

/** Chemins publics locaux uniquement : jamais d'URL externe ou temporaire. */
export const cinematicIntroAudioPathPattern = /^\/audio\/[A-Za-z0-9][A-Za-z0-9._-]{0,79}\.(mp3|ogg|wav|m4a|webm)$/;

export function isValidCinematicIntroAudioPath(value: unknown): value is string {
  return typeof value === 'string' && cinematicIntroAudioPathPattern.test(value) && !value.includes('..');
}

export type CinematicIntroCueType = 'tick' | 'hit' | 'dropout' | 'climax' | 'stop';
export interface CinematicIntroCue {
  /** Millisecondes depuis le début de la portion de fichier utilisée. */
  t: number;
  type: CinematicIntroCueType;
  /** 0–1 (tick/hit). */
  strength?: number;
  /** Durée en ms (dropout/climax). */
  dur?: number;
}

/**
 * Repères du fichier fourni (intro.mp3), exprimés dans la base de temps de la version courte.
 * Ils proviennent d'une ANALYSE DU SIGNAL (enveloppe RMS à 10–20 ms, attaques large bande et basses
 * fréquences) et non d'une écoute : voir IMPLEMENTATION.md. Original : attaque principale à 1,08 s,
 * coupure nette à 2,00 s ; la version courte démarre à 0,04 s de l'original.
 */
export const CINEMATIC_INTRO_PROVIDED_CUES: readonly CinematicIntroCue[] = Object.freeze([
  { t: 290, type: 'tick', strength: 0.3 },
  { t: 530, type: 'tick', strength: 0.3 },
  { t: 730, type: 'tick', strength: 0.35 },
  { t: 870, type: 'hit', strength: 0.55 },
  { t: 985, type: 'dropout', dur: 55 },
  { t: 1040, type: 'hit', strength: 1 },
  { t: 1360, type: 'hit', strength: 0.5 },
  { t: 1430, type: 'hit', strength: 0.8 },
  { t: 1660, type: 'hit', strength: 0.5 },
  { t: 1730, type: 'climax', dur: 230 },
  { t: 1960, type: 'stop' },
]);

export interface CinematicIntroAudioSource {
  preset: CinematicIntroAudioPreset;
  label: string;
  src: string;
  /** Position de départ dans le fichier (ms). */
  startMs: number;
  /** Durée de la portion utilisée (ms) ; remplacée par la durée mesurée quand elle est connue. */
  spanMs: number;
  /** Les repères sont connus uniquement pour le fichier fourni. */
  cues: readonly CinematicIntroCue[] | null;
}

export const cinematicIntroAudioSources: Record<'short' | 'source', CinematicIntroAudioSource> = {
  short: {
    preset: 'short',
    label: 'Version courte optimisée (1,99 s) — par défaut',
    src: '/audio/intro-glitch.mp3',
    startMs: 0,
    spanMs: 1992,
    cues: CINEMATIC_INTRO_PROVIDED_CUES,
  },
  source: {
    preset: 'source',
    label: 'Fichier original intro.mp3 (4,92 s, portion 0,04–2,00 s utilisée)',
    src: '/audio/intro-glitch-source.mp3',
    startMs: 40,
    spanMs: 1960,
    cues: CINEMATIC_INTRO_PROVIDED_CUES,
  },
};

/* ------------------------------------------------------------------ */
/* Normalisation défensive                                             */
/* ------------------------------------------------------------------ */

const hex = /^#[0-9a-fA-F]{6}$/;

function pickNumber(value: unknown, fallback: number, min: number, max: number, step = 1): number {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) return fallback;
  const clamped = Math.min(max, Math.max(min, parsed));
  return step > 1 ? Math.round(clamped / step) * step : Math.round(clamped);
}
function pickBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}
function pickColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && hex.test(value.trim()) ? value.trim().toLowerCase() : fallback;
}
// eslint-disable-next-line no-control-regex
const controlChars = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g;
function pickText(value: unknown, fallback: string, min: number, max: number): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.normalize('NFC').replace(controlChars, ' ').replace(/\s+/g, ' ').trim().slice(0, max).trim();
  return cleaned.length >= min ? cleaned : fallback;
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Transforme n'importe quelle valeur (JSON stocké, ancienne version, saisie client) en réglages valides.
 * Les valeurs absentes ou invalides retombent sur les valeurs par défaut ; les nombres sont bornés.
 * C'est ce qui garantit la compatibilité avec les réglages enregistrés avant l'existence de cette fonctionnalité.
 */
export function sanitizeCinematicIntroSettings(input: unknown): CinematicIntroSettings {
  const d = defaultCinematicIntroSettings;
  const L = cinematicIntroLimits;
  const raw = isRecord(input) ? input : {};
  const durations = isRecord(raw.durations) ? raw.durations : {};
  const effects = isRecord(raw.effects) ? raw.effects : {};
  const palette = isRecord(raw.palette) ? raw.palette : {};
  const audio = isRecord(raw.audio) ? raw.audio : {};

  const preset = pickEnum<CinematicIntroAudioPreset>(audio.preset, ['short', 'source', 'custom'], d.audio.preset);
  const customSrc = isValidCinematicIntroAudioPath(audio.customSrc) ? audio.customSrc : '';
  const showSubtitle = pickBool(raw.showSubtitle, d.showSubtitle);
  const subtitle = typeof raw.subtitle === 'string' ? pickText(raw.subtitle, '', 0, L.subtitle.max) : d.subtitle;
  const weight = Number(raw.fontWeight);

  return {
    enabled: pickBool(raw.enabled, d.enabled),
    frequency: pickEnum(raw.frequency, ['session', 'always', 'first-visit'] as const, d.frequency),
    revision: pickNumber(raw.revision, d.revision, L.revision.min, L.revision.max),
    replayButton: pickBool(raw.replayButton, d.replayButton),
    reducedMotion: pickEnum(raw.reducedMotion, ['skip', 'minimal'] as const, d.reducedMotion),

    text: pickText(raw.text, d.text, L.text.min, L.text.max),
    fontFamily: pickEnum(raw.fontFamily, ['space-grotesk', 'dm-mono'] as const, d.fontFamily),
    fontWeight: (cinematicIntroWeights as readonly number[]).includes(weight) ? weight : d.fontWeight,
    showSubtitle: showSubtitle && subtitle.length > 0,
    subtitle,

    durations: {
      lettersMs: pickNumber(durations.lettersMs, d.durations.lettersMs, L.lettersMs.min, L.lettersMs.max),
      glitchMs: pickNumber(durations.glitchMs, d.durations.glitchMs, L.glitchMs.min, L.glitchMs.max),
      holdMs: pickNumber(durations.holdMs, d.durations.holdMs, L.holdMs.min, L.holdMs.max),
      outroMs: pickNumber(durations.outroMs, d.durations.outroMs, L.outroMs.min, L.outroMs.max),
    },
    effects: {
      glitch: pickNumber(effects.glitch, d.effects.glitch, 0, 100),
      rgbSplit: pickNumber(effects.rgbSplit, d.effects.rgbSplit, 0, 100),
      scanlines: pickNumber(effects.scanlines, d.effects.scanlines, 0, 100),
      distortion: pickNumber(effects.distortion, d.effects.distortion, 0, 100),
      flash: pickNumber(effects.flash, d.effects.flash, 0, 100),
    },
    palette: {
      background: pickColor(palette.background, d.palette.background),
      text: pickColor(palette.text, d.palette.text),
      cyan: pickColor(palette.cyan, d.palette.cyan),
      blue: pickColor(palette.blue, d.palette.blue),
      violet: pickColor(palette.violet, d.palette.violet),
      split: pickColor(palette.split, d.palette.split),
    },
    audio: {
      enabled: pickBool(audio.enabled, d.audio.enabled),
      volume: pickNumber(audio.volume, d.audio.volume, 0, 100),
      // Un chemin personnalisé invalide ne doit jamais produire une lecture cassée : retour à la version courte.
      preset: preset === 'custom' && !customSrc ? 'short' : preset,
      customSrc,
    },
  };
}
