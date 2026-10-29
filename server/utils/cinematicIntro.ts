import { z } from 'zod';
import {
  cinematicIntroLimits as limits,
  cinematicIntroWeights,
  isValidCinematicIntroAudioPath,
} from '../../types/cinematic-intro';

/**
 * Validation STRICTE côté serveur des réglages de l'intro (le client, lui, normalise via
 * `sanitizeCinematicIntroSettings`). Toute valeur hors bornes est refusée avec un 400 par settings.put.ts :
 * aucun nombre négatif, aucune durée extrême, aucune URL audio externe, aucune couleur arbitraire.
 */
// eslint-disable-next-line no-control-regex
const noControlChars = (value: string) => !/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(value);
const percent = z.coerce.number().int().min(limits.percent.min).max(limits.percent.max);
const color = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/);

export const cinematicIntroSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(['session', 'always', 'first-visit']),
  revision: z.coerce.number().int().min(limits.revision.min).max(limits.revision.max),
  replayButton: z.boolean(),
  entryGate: z.boolean(),
  reducedMotion: z.enum(['skip', 'minimal']),

  text: z.string().trim().min(limits.text.min).max(limits.text.max).refine(noControlChars),
  fontFamily: z.enum(['space-grotesk', 'dm-mono']),
  fontWeight: z.coerce.number().refine((value) => (cinematicIntroWeights as readonly number[]).includes(value)),
  showSubtitle: z.boolean(),
  subtitle: z.string().trim().max(limits.subtitle.max).refine(noControlChars),

  durations: z.object({
    lettersMs: z.coerce.number().int().min(limits.lettersMs.min).max(limits.lettersMs.max),
    glitchMs: z.coerce.number().int().min(limits.glitchMs.min).max(limits.glitchMs.max),
    holdMs: z.coerce.number().int().min(limits.holdMs.min).max(limits.holdMs.max),
    outroMs: z.coerce.number().int().min(limits.outroMs.min).max(limits.outroMs.max),
  }),
  effects: z.object({ glitch: percent, rgbSplit: percent, scanlines: percent, distortion: percent, flash: percent }),
  palette: z.object({ background: color, text: color, cyan: color, blue: color, violet: color, split: color }),

  audio: z.object({
    enabled: z.boolean(),
    volume: z.coerce.number().int().min(limits.volume.min).max(limits.volume.max),
    preset: z.enum(['short', 'source', 'custom']),
    // Chemin public local uniquement (/audio/xxx.mp3). Jamais d'URL externe ou temporaire.
    customSrc: z.union([z.literal(''), z.string().refine(isValidCinematicIntroAudioPath)]),
  }).refine((audio) => audio.preset !== 'custom' || audio.customSrc !== ''),
});
