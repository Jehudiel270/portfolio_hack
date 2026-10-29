/**
 * Carrelfolio — Introduction cinématique : moteur.
 *
 * Deux couches dans ce fichier :
 *  1. des fonctions PURES et déterministes (chronologie, plan audio, partition du glitch, fréquence
 *     d'affichage, script de démarrage) — testables sous Node sans navigateur ;
 *  2. le composable `useCinematicIntroRunner`, qui orchestre la séquence dans le navigateur
 *     (timers, rAF, audio, focus, inert, nettoyage). Il n'accède à `window`/`document` que depuis
 *     des méthodes appelées côté client : aucun effet de bord au rendu serveur.
 *
 * Aucune bibliothèque d'animation : les transformations/opacités sont du CSS (voir CinematicIntro.vue),
 * le JS ne fait que coordonner la séquence, l'audio et ~25 variables CSS par image de glitch.
 */
import { nextTick, ref, type Ref } from 'vue';
import {
  CINEMATIC_INTRO_PROVIDED_CUES,
  cinematicIntroAudioSources,
  sanitizeCinematicIntroSettings,
  type CinematicIntroCue,
  type CinematicIntroSettings,
} from '../types/cinematic-intro';

/* ================================================================== */
/* 1. Fonctions pures                                                  */
/* ================================================================== */

export interface CinematicChar { ch: string; index: number; delayMs: number }
export interface CinematicWord { chars: CinematicChar[] }
export interface CinematicText {
  words: CinematicWord[];
  /** Indices (0..n-1) des caractères visibles, espaces exclus. */
  visibleIndices: number[];
  charDurationMs: number;
  staggerMs: number;
}

let segmenter: { segment(input: string): Iterable<{ segment: string }> } | null | undefined;
function graphemes(text: string): string[] {
  if (segmenter === undefined) {
    const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(i: string): Iterable<{ segment: string }> } }).Segmenter;
    segmenter = Seg ? new Seg(undefined, { granularity: 'grapheme' }) : null;
  }
  return segmenter ? Array.from(segmenter.segment(text), (part) => part.segment) : Array.from(text);
}

/**
 * Découpe le texte en mots → caractères (graphèmes Unicode, donc accents combinés et emojis intacts).
 * Les délais sont calculés à partir du texte réel et de la durée configurée : la dernière lettre
 * termine son animation exactement à `lettersMs`, quelle que soit la longueur du nom.
 */
export function splitCinematicText(text: string, lettersMs: number): CinematicText {
  const words = text.normalize('NFC').split(/\s+/u).filter(Boolean);
  const visible = words.reduce((sum, word) => sum + graphemes(word).length, 0);
  const charDurationMs = Math.round(Math.min(460, Math.max(160, lettersMs * 0.5)));
  const staggerMs = visible > 1 ? Math.max(0, (lettersMs - charDurationMs) / (visible - 1)) : 0;
  let cursor = 0;
  const visibleIndices: number[] = [];
  return {
    words: words.map((word) => ({
      chars: graphemes(word).map((ch) => {
        const index = cursor++;
        visibleIndices.push(index);
        return { ch, index, delayMs: Math.round(index * staggerMs) };
      }),
    })),
    visibleIndices,
    charDurationMs,
    staggerMs,
  };
}

export interface CinematicTimeline {
  lettersMs: number;
  glitchMs: number;
  holdMs: number;
  outroMs: number;
  glitchStartMs: number;
  holdStartMs: number;
  outroStartMs: number;
  totalMs: number;
}

export function buildCinematicTimeline(settings: CinematicIntroSettings, minimal = false): CinematicTimeline {
  const d = settings.durations;
  // Mode minimal (prefers-reduced-motion) : nom statique bref, puis fondu court. Pas de glitch, pas de son.
  const lettersMs = minimal ? 650 : d.lettersMs;
  const glitchMs = minimal ? 0 : d.glitchMs;
  const holdMs = minimal ? 0 : d.holdMs;
  const outroMs = minimal ? 220 : d.outroMs;
  const glitchStartMs = lettersMs;
  const holdStartMs = glitchStartMs + glitchMs;
  const outroStartMs = holdStartMs + holdMs;
  return { lettersMs, glitchMs, holdMs, outroMs, glitchStartMs, holdStartMs, outroStartMs, totalMs: outroStartMs + outroMs };
}

export interface CinematicAudioPlan {
  /** Le son doit-il être joué ? (les repères visuels restent calculés même en mode muet) */
  enabled: boolean;
  src: string;
  volume: number; // 0..1
  /** Position dans le fichier au moment du démarrage (ms). */
  seekMs: number;
  /** Retard de démarrage par rapport au début de la phase glitch (ms, ≥ 0). */
  delayMs: number;
  /** Instant d'arrêt, relatif au début de la phase glitch (ms). */
  stopAtMs: number;
  fadeOutMs: number;
  /** Repères déjà exprimés dans le temps de la phase glitch. */
  cues: CinematicIntroCue[];
}

/** Tolérance sous laquelle on considère que durée du glitch et durée du son sont « les mêmes ». */
const AUDIO_ALIGN_TOLERANCE_MS = 80;

function genericCues(glitchMs: number): CinematicIntroCue[] {
  const at = (ratio: number) => Math.round(glitchMs * ratio);
  return [
    { t: at(0.2), type: 'tick', strength: 0.3 },
    { t: at(0.36), type: 'tick', strength: 0.3 },
    { t: at(0.5), type: 'dropout', dur: 55 },
    { t: at(0.52), type: 'hit', strength: 1 },
    { t: at(0.7), type: 'hit', strength: 0.6 },
    { t: at(0.86), type: 'climax', dur: at(0.12) },
    { t: at(0.98), type: 'stop' },
  ];
}

/**
 * Calcule comment le son s'inscrit dans la phase glitch quelle que soit la durée réglée dans le Dashboard.
 *
 * Règle d'alignement (fichier fourni) : l'ARRÊT NET du son coïncide avec la stabilisation visuelle.
 *  - durées proches (±80 ms, cas par défaut) : le son démarre avec le glitch ;
 *  - glitch plus long que le son : le son démarre plus tard (montée visuelle silencieuse) ;
 *  - glitch plus court : on saute le début du fichier (jamais d'accélération → pas de dégradation).
 * Fichier personnalisé : repères génériques proportionnels, lecture depuis 0, coupure en fondu à la fin.
 */
export function planCinematicAudio(settings: CinematicIntroSettings, glitchMs: number, measuredSpanMs?: number): CinematicAudioPlan {
  const { audio } = settings;
  const volume = Math.min(1, Math.max(0, audio.volume / 100));

  if (audio.preset === 'custom' && audio.customSrc) {
    const span = Math.min(glitchMs, measuredSpanMs && Number.isFinite(measuredSpanMs) ? measuredSpanMs : glitchMs);
    return {
      enabled: audio.enabled && volume > 0,
      src: audio.customSrc,
      volume,
      seekMs: 0,
      delayMs: 0,
      stopAtMs: Math.round(span),
      fadeOutMs: 160,
      cues: genericCues(glitchMs),
    };
  }

  const source = cinematicIntroAudioSources[audio.preset === 'source' ? 'source' : 'short'];
  const delta = glitchMs - source.spanMs;
  let shift = 0;
  let delayMs = 0;
  let seekMs = source.startMs;
  if (delta > AUDIO_ALIGN_TOLERANCE_MS) { shift = delta; delayMs = delta; }
  else if (delta < -AUDIO_ALIGN_TOLERANCE_MS) { shift = delta; seekMs = source.startMs - delta; }

  const cues: CinematicIntroCue[] = [];
  for (const cue of CINEMATIC_INTRO_PROVIDED_CUES) {
    const t = cue.t + shift;
    if (t >= 0 && t <= glitchMs) cues.push({ ...cue, t });
  }
  return {
    enabled: audio.enabled && volume > 0,
    src: source.src,
    volume,
    seekMs,
    delayMs,
    stopAtMs: Math.min(glitchMs, source.spanMs + shift),
    fadeOutMs: 25,
    cues,
  };
}

/* ---------------------------- Partition du glitch ---------------------------- */

export const GLITCH_SLICE_COUNT = 6;

export interface GlitchSliceFrame { y: number; h: number; x: number; o: number }
export interface GlitchFrame {
  /** Instant d'application, ms depuis le début de la phase glitch. */
  t: number;
  amp: number;
  /** Écart de la séparation RVB, en em (signé). */
  rgb: number;
  ghost: number;
  shift: number;
  skew: number;
  bright: number;
  noise: number;
  nx: number;
  ny: number;
  flash: number;
  scan: number;
  slices: GlitchSliceFrame[];
  hidden: number[];
}

const neutralSlices = (): GlitchSliceFrame[] => Array.from({ length: GLITCH_SLICE_COUNT }, () => ({ y: 0, h: 0, x: 0, o: 0 }));
export const CINEMATIC_NEUTRAL_FRAME: GlitchFrame = Object.freeze({
  t: 0, amp: 0, rgb: 0, ghost: 0, shift: 0, skew: 0, bright: 1, noise: 0.02, nx: 0, ny: 0, flash: 0, scan: 0.7,
  slices: neutralSlices(), hidden: [],
}) as GlitchFrame;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, digits = 3) => Math.round(v * 10 ** digits) / 10 ** digits;

/** Sécurité photosensibilité : au plus 3 flashs plein écran par fenêtre glissante d'une seconde. */
export const CINEMATIC_MAX_FLASHES_PER_SECOND = 3;

export interface GlitchScoreInput {
  glitchMs: number;
  cues: CinematicIntroCue[];
  effects: CinematicIntroSettings['effects'];
  visibleIndices: number[];
  seed: number;
}

/**
 * Compose la séquence du glitch : crescendo → pic → résolution propre.
 * Les images sont irrégulières (≈ 30–95 ms), comme un vrai signal instable, et alignées sur les repères
 * du son (attaques, coupure de signal, climax, arrêt net). Déterministe pour une graine donnée.
 */
export function buildGlitchScore(input: GlitchScoreInput): GlitchFrame[] {
  const { glitchMs, effects, visibleIndices } = input;
  const rng = mulberry32(input.seed);
  const g = clamp(effects.glitch / 100, 0, 1);
  const rgbK = clamp(effects.rgbSplit / 100, 0, 1);
  const distK = clamp(effects.distortion / 100, 0, 1);
  const flashK = clamp(effects.flash / 100, 0, 1);

  const cues = input.cues.filter((c) => c.t >= 0 && c.t <= glitchMs).sort((a, b) => a.t - b.t);
  const stopCue = cues.find((c) => c.type === 'stop');
  const stopT = stopCue ? stopCue.t : Math.round(glitchMs * 0.98);
  const hits = cues.filter((c) => c.type === 'hit' || c.type === 'tick');
  const drops = cues.filter((c) => c.type === 'dropout').map((c) => ({ from: c.t, to: c.t + (c.dur ?? 55) }));
  const climaxes = cues.filter((c) => c.type === 'climax').map((c) => ({ from: c.t, to: Math.min(stopT, c.t + (c.dur ?? 200)) }));

  const inClimax = (t: number) => climaxes.some((w) => t >= w.from && t < w.to);
  const inDrop = (t: number) => drops.some((w) => t >= w.from && t < w.to);

  const envelope = (t: number) => {
    if (t >= stopT) return 0;
    let value = 0.2 + 0.5 * smooth(t / Math.max(1, stopT * 0.95));
    if (inClimax(t)) value = Math.max(value, 0.92);
    for (const hit of hits) {
      const age = t - hit.t;
      if (age >= 0 && age < 280) value = Math.max(value, Math.min(1, value + (hit.strength ?? 0.5) * 0.55 * Math.exp(-age / 120)));
    }
    return clamp(value, 0, 1);
  };
  const lastHit = (t: number) => {
    let found: { age: number; strength: number; kind: string; cueT: number } | null = null;
    for (const hit of hits) {
      const age = t - hit.t;
      if (age >= 0 && age < 200) found = { age, strength: hit.strength ?? 0.5, kind: hit.type, cueT: hit.t };
    }
    return found;
  };

  /* --- Instants des images : repères verrouillés + remplissage irrégulier --- */
  type Slot = { t: number; locked: boolean };
  const slots: Slot[] = [{ t: 0, locked: true }];
  for (const cue of cues) {
    slots.push({ t: cue.t, locked: true });
    if (cue.type === 'hit') { slots.push({ t: cue.t + 45, locked: false }, { t: cue.t + 110, locked: false }); }
    if (cue.type === 'dropout') slots.push({ t: cue.t + (cue.dur ?? 55), locked: true });
  }
  slots.push({ t: stopT + 50, locked: true }, { t: stopT + 100, locked: true });
  for (let t = 0; t < stopT;) {
    t += (inClimax(t) ? 30 : 42) + rng() * (inClimax(t) ? 28 : 52);
    if (t < stopT) slots.push({ t: Math.round(t), locked: false });
  }
  slots.sort((a, b) => a.t - b.t || Number(b.locked) - Number(a.locked));
  const times: number[] = [];
  const keptLocked: boolean[] = [];
  const MIN_GAP = 14;
  slots.forEach((slot, i) => {
    const previous = times[times.length - 1];
    if (previous !== undefined && slot.t - previous < MIN_GAP) {
      // Un repère verrouillé (attaque du son) l'emporte toujours sur une image de remplissage trop proche.
      if (slot.locked && !keptLocked[keptLocked.length - 1]) { times.pop(); keptLocked.pop(); } else return;
    }
    const next = slots[i + 1];
    if (!slot.locked && next && next.locked && next.t - slot.t < MIN_GAP) return;
    times.push(slot.t);
    keptLocked.push(slot.locked);
  });

  /* --- Valeurs de chaque image --- */
  const flashEvents: number[] = [];
  const allowFlash = (t: number) => {
    const recent = flashEvents.filter((time) => t - time < 1000);
    if (recent.length >= CINEMATIC_MAX_FLASHES_PER_SECOND) return false;
    flashEvents.push(t);
    return true;
  };

  let sign = rng() < 0.5 ? -1 : 1;
  const flashGranted = new Set<number>();
  const frames: GlitchFrame[] = [];

  for (const t of times) {
    if (t > stopT + 100) break;
    const settle = t >= stopT;
    if (settle && t >= stopT + 100) { frames.push({ ...CINEMATIC_NEUTRAL_FRAME, t, slices: neutralSlices(), hidden: [] }); break; }

    const drop = inDrop(t);
    const hit = lastHit(t);
    let amp = settle ? (t < stopT + 50 ? 0.34 : 0.12) : envelope(t);
    if (drop) amp = Math.min(amp, 0.3);
    amp *= g > 0 ? 1 : 0;

    if (hit && hit.age < 60) sign = rng() < 0.5 ? -1 : 1;
    else if (rng() < 0.18) sign = -sign;

    const big = !!hit && hit.kind === 'hit' && hit.age < 120;
    const rgb = round(sign * (0.012 + 0.078 * amp + (big ? 0.03 * hit!.strength : 0)) * rgbK * (0.65 + 0.7 * rng()));
    const ghost = round(rgbK === 0 ? 0 : clamp((0.25 + 0.75 * amp) * Math.min(1, rgbK * 1.4), 0, 1));

    const shiftChance = (0.25 + 0.5 * amp) * distK + (big ? 0.5 : 0);
    const shift = rng() < shiftChance ? round((rng() * 2 - 1) * (0.07 * amp + (big ? 0.05 : 0)) * Math.max(distK, 0.15)) : 0;
    const skew = rng() < 0.3 * amp * distK + (big ? 0.4 * distK : 0) ? round((rng() * 2 - 1) * 9 * amp * distK, 2) : 0;

    let bright = 1;
    if (drop) bright = 0.55;
    else if (big && hit!.age < 50) bright = 1.15;
    else if (rng() < 0.4) bright = round(1 + (rng() * 2 - 1) * 0.16 * amp * g, 2);

    const noise = round(drop ? 0.45 * g : (0.04 + 0.22 * amp) * g + (settle ? 0 : 0.01));

    /* Flash : uniquement sur les attaques fortes et la coupure finale, avec limiteur global (≤ 3 / s). */
    let flash = 0;
    if (flashK > 0) {
      if (hit && hit.kind === 'hit' && hit.strength >= 0.75) {
        if (hit.age < MIN_GAP && !flashGranted.has(hit.cueT)) {
          if (allowFlash(t)) { flash = round(0.26 * hit.strength * flashK); flashGranted.add(hit.cueT); }
        } else if (flashGranted.has(hit.cueT) && hit.age >= 40 && hit.age < 100) {
          flash = round(0.09 * hit.strength * flashK);
        }
      } else if (t === stopT && allowFlash(t)) {
        flash = round(0.16 * flashK);
      }
    }

    /* Tranches horizontales */
    const sliceTarget = drop ? 2 : settle ? (amp > 0.2 ? 2 : 0) : Math.round((0.6 + 5.4 * amp * (0.35 + 0.65 * distK)) * g);
    const sliceCount = clamp(big ? Math.max(sliceTarget, 5) : sliceTarget, 0, GLITCH_SLICE_COUNT);
    const slices = neutralSlices();
    for (let i = 0; i < sliceCount; i += 1) {
      slices[i] = {
        y: round(rng() * 92, 1),
        h: round(2.5 + rng() * (6 + 14 * amp), 1),
        x: round((rng() * 2 - 1) * (0.05 + 0.2 * amp) * (0.4 + 0.6 * distK)),
        o: 1,
      };
    }

    /* Disparitions partielles de lettres (lisibilité préservée : jamais plus d'un quart du nom, sauf coupure de signal). */
    const hidden: number[] = [];
    if (visibleIndices.length && !settle && g > 0) {
      const pool = [...visibleIndices];
      const pick = (n: number) => { for (let i = 0; i < n && pool.length; i += 1) hidden.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!); };
      if (drop) pick(Math.max(1, Math.round(visibleIndices.length * 0.7)));
      else {
        const chance = (0.1 + 0.3 * amp) * g * (inClimax(t) ? 0.5 : 1);
        if (rng() < chance) pick(1 + Math.floor(rng() * Math.min(3, Math.max(1, Math.ceil(visibleIndices.length * 0.25)))));
      }
    }

    frames.push({
      t, amp: round(amp), rgb, ghost, shift, skew, bright, noise,
      nx: Math.floor(rng() * 256), ny: Math.floor(rng() * 256),
      flash, scan: round(0.7 + 0.3 * amp), slices, hidden,
    });
  }

  if (!frames.length || frames[frames.length - 1]!.amp !== 0 || frames[frames.length - 1]!.hidden.length) {
    frames.push({ ...CINEMATIC_NEUTRAL_FRAME, t: stopT + 100, slices: neutralSlices(), hidden: [] });
  }
  // Garantit des temps strictement croissants.
  return frames.filter((frame, i) => i === 0 || frame.t > frames[i - 1]!.t);
}

/* ------------------------- Fréquence d'affichage ------------------------- */

export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface CinematicStorages { session?: StorageLike | null; local?: StorageLike | null }

export const cinematicIntroStorageKey = (revision: number) => `carrelfolio:intro:r${revision}`;

export function hasSeenCinematicIntro(settings: Pick<CinematicIntroSettings, 'frequency' | 'revision'>, storages: CinematicStorages): boolean {
  try {
    const key = cinematicIntroStorageKey(settings.revision);
    if (settings.frequency === 'session') return storages.session?.getItem(key) === '1';
    if (settings.frequency === 'first-visit') return storages.local?.getItem(key) === '1';
  } catch { /* stockage indisponible (navigation privée stricte) : on considère « jamais vu » */ }
  return false;
}

export function markCinematicIntroSeen(settings: Pick<CinematicIntroSettings, 'frequency' | 'revision'>, storages: CinematicStorages): void {
  try {
    const key = cinematicIntroStorageKey(settings.revision);
    if (settings.frequency === 'session') storages.session?.setItem(key, '1');
    else if (settings.frequency === 'first-visit') storages.local?.setItem(key, '1');
  } catch { /* ignoré : au pire l'intro se rejoue */ }
}

export type CinematicStartDecision = 'play' | 'minimal' | 'skip';
export function decideCinematicIntroStart(settings: CinematicIntroSettings, ctx: { prefersReducedMotion: boolean; storages: CinematicStorages }): CinematicStartDecision {
  if (!settings.enabled) return 'skip';
  if (hasSeenCinematicIntro(settings, ctx.storages)) return 'skip';
  if (ctx.prefersReducedMotion) return settings.reducedMotion === 'minimal' ? 'minimal' : 'skip';
  return 'play';
}

/**
 * Petit script inline exécuté dans <head> AVANT le premier affichage : il pose
 * `data-cinematic-intro="pending" | "skip"` sur <html>, ce qui évite qu'un visiteur déjà passé voie
 * l'overlay clignoter pendant l'hydratation. Il n'embarque que des valeurs validées (énumération,
 * entier) — aucun texte libre, donc aucune injection possible.
 */
export function buildCinematicBootScript(settings: Pick<CinematicIntroSettings, 'frequency' | 'revision' | 'reducedMotion'>): string {
  const frequency = settings.frequency === 'always' || settings.frequency === 'first-visit' ? settings.frequency : 'session';
  const revision = Math.max(1, Math.min(9999, Math.trunc(Number(settings.revision)) || 1));
  const skipOnReduced = settings.reducedMotion === 'skip' ? 1 : 0;
  const key = cinematicIntroStorageKey(revision);
  return `(function(){var d=document.documentElement;try{var f="${frequency}",s=0;`
    + `if(f==="session")s=sessionStorage.getItem("${key}")==="1";`
    + `else if(f==="first-visit")s=localStorage.getItem("${key}")==="1";`
    + `var r=${skipOnReduced}&&window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;`
    + `d.setAttribute("data-cinematic-intro",s||r?"skip":"pending")}catch(e){d.setAttribute("data-cinematic-intro","pending")}})();`;
}

/* ================================================================== */
/* 2. Orchestration navigateur                                         */
/* ================================================================== */

export type CinematicIntroPhase = 'pending' | 'letters' | 'glitch' | 'hold' | 'outro' | 'done';

interface RunnerOptions {
  settings: () => CinematicIntroSettings;
  root: Ref<HTMLElement | null>;
  /** Aperçu Dashboard : ne lit ni n'écrit la fréquence d'affichage. */
  preview: boolean;
  onFinish: (info: { skipped: boolean; reason: 'completed' | 'skipped' | 'not-needed' }) => void;
}

interface RunState {
  settings: CinematicIntroSettings;
  timeline: CinematicTimeline;
  plan: CinematicAudioPlan | null;
  timers: number[];
  raf: number;
  audio: HTMLAudioElement | null;
  glitchStartAbs: number;
  finished: boolean;
  previousFocus: Element | null;
  restoreInert: Array<() => void>;
  fadeTimer: number;
  onKey: (event: KeyboardEvent) => void;
}

const DOC_ATTR = 'data-cinematic-intro';

export function useCinematicIntroRunner(options: RunnerOptions) {
  const phase = ref<CinematicIntroPhase>('pending');
  const armed = ref(false);
  const soundBlocked = ref(false);
  const minimalMode = ref(false);
  const entryGateVisible = ref(false);
  let run: RunState | null = null;
  let previousHidden = new Set<number>();

  const setDocState = (value: 'pending' | 'running' | 'skip' | 'done') => document.documentElement.setAttribute(DOC_ATTR, value);
  const storages = (): CinematicStorages => {
    const safe = (getter: () => Storage) => { try { return getter(); } catch { return null; } };
    return { session: safe(() => window.sessionStorage), local: safe(() => window.localStorage) };
  };
  const prefersReducedMotion = () => !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------- Application d'une image ---------------------------- */
  function applyFrame(frame: GlitchFrame) {
    const root = options.root.value;
    if (!root) return;
    const style = root.style;
    style.setProperty('--cin-amp', String(frame.amp));
    style.setProperty('--cin-rgb', `${frame.rgb}em`);
    style.setProperty('--cin-ghost', String(frame.ghost));
    style.setProperty('--cin-shift', `${frame.shift}em`);
    style.setProperty('--cin-skew', `${frame.skew}deg`);
    style.setProperty('--cin-bright', String(frame.bright));
    style.setProperty('--cin-noise', String(frame.noise));
    style.setProperty('--cin-nx', `${frame.nx}px`);
    style.setProperty('--cin-ny', `${frame.ny}px`);
    style.setProperty('--cin-flash', String(frame.flash));
    style.setProperty('--cin-scan-k', String(frame.scan));
    const slices = root.querySelectorAll<HTMLElement>('.cin-slice');
    slices.forEach((el, i) => {
      const slice = frame.slices[i];
      if (!slice) return;
      el.style.setProperty('--y', `${slice.y}%`);
      el.style.setProperty('--h', `${slice.h}%`);
      el.style.setProperty('--x', `${slice.x}em`);
      el.style.setProperty('--o', String(slice.o));
    });
    const nextHidden = new Set(frame.hidden);
    if (nextHidden.size || previousHidden.size) {
      root.querySelectorAll<HTMLElement>('.cin-main [data-ci]').forEach((el) => {
        const index = Number(el.dataset.ci);
        el.classList.toggle('is-off', nextHidden.has(index));
      });
    }
    previousHidden = nextHidden;
  }
  const applyNeutral = () => applyFrame(CINEMATIC_NEUTRAL_FRAME);

  /* ------------------------------------ Audio ------------------------------------ */
  function createAudio(plan: CinematicAudioPlan): HTMLAudioElement | null {
    if (!plan.enabled || typeof Audio === 'undefined') return null;
    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = plan.volume;
      audio.src = plan.src;
      // Fichier absent / illisible : l'intro visuelle continue, sans message ni bouton de son.
      audio.addEventListener('error', () => { if (run?.audio === audio) releaseAudio(); }, { once: true });
      audio.load();
      return audio;
    } catch { return null; }
  }
  function releaseAudio() {
    if (!run) return;
    window.clearInterval(run.fadeTimer);
    const audio = run.audio;
    run.audio = null;
    if (!audio) return;
    try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch { /* déjà libéré */ }
  }
  function seekAudio(audio: HTMLAudioElement, positionMs: number) {
    if (positionMs <= 0) return;
    const seek = () => {
      if (run?.audio !== audio) return;
      try { audio.currentTime = positionMs / 1000; } catch { /* le média peut encore être en cours d'initialisation */ }
    };
    if (audio.readyState >= 1) seek();
    else audio.addEventListener('loadedmetadata', seek, { once: true });
  }
  function playAudio(audio: HTMLAudioElement, plan: CinematicAudioPlan) {
    const attempt = audio.play();
    if (!attempt || typeof attempt.then !== 'function') return;
    attempt.then(() => {
      if (run?.audio !== audio || run.finished) return;
      soundBlocked.value = false;
      const elapsed = performance.now() - run.glitchStartAbs;
      const remaining = plan.stopAtMs - elapsed;
      if (remaining <= 0) { releaseAudio(); return; }
      seekAudio(audio, plan.seekMs + Math.max(0, elapsed - plan.delayMs));
      const fadeDuration = Math.min(plan.fadeOutMs, remaining);
      const fadeDelay = Math.max(0, remaining - fadeDuration);
      run.timers.push(window.setTimeout(() => fadeOutAudio(fadeDuration), fadeDelay));
    }).catch((error: unknown) => {
      if ((error as { name?: string })?.name === 'NotAllowedError') soundBlocked.value = true;
      else if (run?.audio === audio) releaseAudio();
    });
  }
  function startAudio() {
    if (!run?.audio || !run.plan) return;
    const { audio, plan } = run;
    seekAudio(audio, plan.seekMs);
    playAudio(audio, plan);
  }
  function fadeOutAudio(durationMs?: number) {
    if (!run?.audio || !run.plan) return;
    const audio = run.audio;
    const duration = durationMs ?? run.plan.fadeOutMs;
    const steps = Math.max(2, Math.round(duration / 10));
    const start = audio.volume;
    let i = 0;
    run.fadeTimer = window.setInterval(() => {
      i += 1;
      try { audio.volume = Math.max(0, start * (1 - i / steps)); } catch { /* ignoré */ }
      if (i >= steps) { window.clearInterval(run?.fadeTimer); releaseAudio(); }
    }, 10);
  }
  function enableSound() {
    if (!run?.audio || !run.plan || run.finished) return;
    const elapsed = performance.now() - run.glitchStartAbs;
    if (elapsed < 0 || run.plan.stopAtMs - elapsed < 80) return;
    const position = run.plan.seekMs + Math.max(0, elapsed - run.plan.delayMs);
    seekAudio(run.audio, position);
    playAudio(run.audio, run.plan);
  }

  /* --------------------------- Focus, inert, scroll --------------------------- */
  function lockPage(state: RunState) {
    const root = options.root.value;
    setDocState('running');
    state.previousFocus = document.activeElement;
    const parent = root?.parentElement;
    if (root && parent) {
      Array.from(parent.children).forEach((child) => {
        if (child === root || !(child instanceof HTMLElement)) return;
        if (['SCRIPT', 'STYLE', 'LINK', 'NOSCRIPT'].includes(child.tagName) || child.inert) return;
        child.inert = true;
        state.restoreInert.push(() => { child.inert = false; });
      });
    }
    root?.querySelector<HTMLButtonElement>('.cin-skip')?.focus({ preventScroll: true });
    state.onKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); finish(true); return; }
      if (event.key !== 'Tab' || !root) return;
      const focusables = Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled])'));
      if (!focusables.length) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', state.onKey);
  }
  function unlockPage(state: RunState) {
    window.removeEventListener('keydown', state.onKey);
    state.restoreInert.splice(0).forEach((restore) => restore());
    const previous = state.previousFocus;
    if (previous instanceof HTMLElement && previous !== document.body && document.contains(previous)) previous.focus({ preventScroll: true });
  }

  /* ------------------------------ Cycle de vie ------------------------------ */
  function teardown() {
    if (!run) return;
    run.timers.forEach((id) => window.clearTimeout(id));
    run.timers = [];
    window.cancelAnimationFrame(run.raf);
    releaseAudio();
    unlockPage(run);
    run.finished = true;
  }

  function finish(skipped: boolean) {
    if (!run || run.finished) return;
    teardown();
    applyNeutral();
    setDocState('done');
    soundBlocked.value = false;
    armed.value = false;
    phase.value = 'done';
    options.onFinish({ skipped, reason: skipped ? 'skipped' : 'completed' });
  }

  function playScore(state: RunState, frames: GlitchFrame[]) {
    let index = 0;
    const tick = () => {
      if (state.finished || phase.value === 'outro' || phase.value === 'done') return;
      const elapsed = performance.now() - state.glitchStartAbs;
      while (index < frames.length && frames[index]!.t <= elapsed) { applyFrame(frames[index]!); index += 1; }
      if (index < frames.length) state.raf = window.requestAnimationFrame(tick);
    };
    state.raf = window.requestAnimationFrame(tick);
  }

  async function begin(kind: 'play' | 'minimal', markSeen: boolean, withSound = true) {
    const settings = sanitizeCinematicIntroSettings(options.settings());
    if (!withSound) settings.audio = { ...settings.audio, enabled: false };
    phase.value = 'pending';
    await nextTick();
    if (!options.root.value) { options.onFinish({ skipped: false, reason: 'not-needed' }); return; }

    const minimal = kind === 'minimal';
    minimalMode.value = minimal;
    const timeline = buildCinematicTimeline(settings, minimal);
    const plan = minimal ? null : planCinematicAudio(settings, timeline.glitchMs);
    const state: RunState = {
      settings, timeline, plan, timers: [], raf: 0, audio: null, glitchStartAbs: Number.POSITIVE_INFINITY,
      finished: false, previousFocus: null, restoreInert: [], fadeTimer: 0, onKey: () => {},
    };
    run = state;
    previousHidden = new Set();
    armed.value = true; // désarme le filet de sécurité CSS : le JS a pris la main
    lockPage(state);
    if (markSeen && !options.preview) markCinematicIntroSeen(settings, storages());
    state.audio = plan ? createAudio(plan) : null;
    applyNeutral();

    // Attend la police (max 300 ms) pour ne pas animer les lettres avec une police de secours.
    const family = settings.fontFamily === 'dm-mono' ? '"DM Mono"' : '"Space Grotesk"';
    try {
      await Promise.race([
        document.fonts?.load?.(`${settings.fontWeight} 64px ${family}`, settings.text) ?? Promise.resolve(),
        new Promise((resolve) => window.setTimeout(resolve, 300)),
      ]);
    } catch { /* police indisponible : repli CSS */ }
    if (state.finished || run !== state) return;

    const t0 = performance.now();
    const at = (ms: number, fn: () => void) => { state.timers.push(window.setTimeout(fn, Math.max(0, ms - (performance.now() - t0)))); };
    state.glitchStartAbs = t0 + timeline.glitchStartMs;

    phase.value = 'letters';
    if (!minimal && plan) {
      at(timeline.glitchStartMs, () => {
        phase.value = 'glitch';
        const text = splitCinematicText(settings.text, timeline.lettersMs);
        const frames = buildGlitchScore({
          glitchMs: timeline.glitchMs,
          cues: plan.cues,
          effects: settings.effects,
          visibleIndices: text.visibleIndices,
          seed: (Math.random() * 4294967296) >>> 0,
        });
        playScore(state, frames);
      });
      if (state.audio) at(timeline.glitchStartMs + plan.delayMs, startAudio);
      at(timeline.holdStartMs, () => { phase.value = 'hold'; });
    }
    at(timeline.outroStartMs, () => { phase.value = 'outro'; applyNeutral(); releaseAudio(); soundBlocked.value = false; });
    at(timeline.totalMs, () => finish(false));
    // Filet de sécurité : jamais d'overlay bloquant, même si un timer est retardé.
    at(timeline.totalMs + 2500, () => finish(false));
  }

  /* ------------------------------ API publique ------------------------------ */

  /** Appelé depuis onMounted (client uniquement). */
  function mount() {
    const settings = sanitizeCinematicIntroSettings(options.settings());
    if (options.preview) { void begin('play', false); return; }
    const decision = decideCinematicIntroStart(settings, { prefersReducedMotion: prefersReducedMotion(), storages: storages() });
    if (decision === 'skip') {
      setDocState('skip');
      phase.value = 'done';
      options.onFinish({ skipped: false, reason: 'not-needed' });
      return;
    }
    if (settings.entryGate) {
      entryGateVisible.value = true;
      phase.value = 'pending';
      armed.value = false;
      setDocState('running');
      return;
    }
    void begin(decision, true);
  }

  function startWithSound() {
    if (!entryGateVisible.value) return;
    entryGateVisible.value = false;
    const reduced = prefersReducedMotion();
    void begin(reduced ? 'minimal' : 'play', true, true);
  }

  function startWithoutSound() {
    if (!entryGateVisible.value) return;
    entryGateVisible.value = false;
    const reduced = prefersReducedMotion();
    void begin(reduced ? 'minimal' : 'play', true, false);
  }

  /** Bouton « Rejouer l'intro » : action explicite du visiteur, donc lecture audio autorisée. */
  function replay() {
    if (run && !run.finished) return;
    entryGateVisible.value = false;
    const reduced = prefersReducedMotion();
    void begin(reduced ? 'minimal' : 'play', false, true);
  }

  function skip() {
    if (entryGateVisible.value) {
      entryGateVisible.value = false;
      setDocState('done');
      phase.value = 'done';
      options.onFinish({ skipped: true, reason: 'skipped' });
      return;
    }
    finish(true);
  }

  /** À appeler depuis onBeforeUnmount : libère tout sans émettre d'événement. */
  function dispose() {
    if (!run || run.finished) return;
    teardown();
    if (typeof document !== 'undefined') setDocState('done');
  }

  return { phase, armed, soundBlocked, minimalMode, entryGateVisible, mount, replay, skip, enableSound, startWithSound, startWithoutSound, dispose };
}
