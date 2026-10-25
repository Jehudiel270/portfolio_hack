import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CINEMATIC_MAX_FLASHES_PER_SECOND,
  GLITCH_SLICE_COUNT,
  buildCinematicBootScript,
  buildCinematicTimeline,
  buildGlitchScore,
  decideCinematicIntroStart,
  hasSeenCinematicIntro,
  markCinematicIntroSeen,
  planCinematicAudio,
  splitCinematicText,
  type StorageLike,
} from '../../composables/useCinematicIntro';
import {
  cinematicIntroLimits,
  cloneCinematicIntroSettings,
  defaultCinematicIntroSettings,
  isValidCinematicIntroAudioPath,
  sanitizeCinematicIntroSettings,
} from '../../types/cinematic-intro';
import { cinematicIntroSchema } from './cinematicIntro';

const memoryStorage = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); } };
};

describe('valeurs par défaut', () => {
  it('correspondent au tableau de la demande', () => {
    const d = defaultCinematicIntroSettings;
    assert.equal(d.text, 'DOSSOU Carrel');
    assert.equal(d.durations.lettersMs, 900);
    assert.equal(d.durations.glitchMs, 2000);
    assert.equal(d.durations.outroMs, 250);
    assert.equal(d.effects.glitch, 80);
    assert.equal(d.audio.volume, 65);
    assert.equal(d.fontFamily, 'space-grotesk');
    assert.equal(d.fontWeight, 700);
    assert.equal(d.frequency, 'session');
    assert.equal(d.audio.enabled, true);
    assert.equal(d.audio.preset, 'short');
    assert.equal(d.palette.background, '#030711');
    assert.equal(d.palette.cyan, '#19e6ef');
    assert.equal(d.palette.blue, '#3588ff');
    assert.equal(d.palette.violet, '#8a5cff');
  });
  it('sanitize(undefined) restitue exactement les valeurs par défaut (réglages anciens compatibles)', () => {
    assert.deepEqual(sanitizeCinematicIntroSettings(undefined), cloneCinematicIntroSettings());
    assert.deepEqual(sanitizeCinematicIntroSettings(null), cloneCinematicIntroSettings());
    assert.deepEqual(sanitizeCinematicIntroSettings('n’importe quoi'), cloneCinematicIntroSettings());
  });
  it('un réglage partiel est complété sans perdre ce qui existe', () => {
    const s = sanitizeCinematicIntroSettings({ enabled: false, durations: { glitchMs: 2400 } });
    assert.equal(s.enabled, false);
    assert.equal(s.durations.glitchMs, 2400);
    assert.equal(s.durations.lettersMs, 900);
    assert.equal(s.text, 'DOSSOU Carrel');
  });
  it('clone profond : modifier le clone ne modifie jamais les valeurs par défaut', () => {
    const clone = cloneCinematicIntroSettings();
    clone.durations.glitchMs = 1234;
    clone.palette.cyan = '#000000';
    assert.equal(defaultCinematicIntroSettings.durations.glitchMs, 2000);
    assert.equal(defaultCinematicIntroSettings.palette.cyan, '#19e6ef');
  });
});

describe('validation et bornes', () => {
  it('borne les durées extrêmes, négatives ou non numériques', () => {
    const s = sanitizeCinematicIntroSettings({ durations: { lettersMs: -50, glitchMs: 9_999_999, holdMs: 'abc', outroMs: Number.NaN } });
    assert.equal(s.durations.lettersMs, cinematicIntroLimits.lettersMs.min);
    assert.equal(s.durations.glitchMs, cinematicIntroLimits.glitchMs.max);
    assert.equal(s.durations.holdMs, 220);
    assert.equal(s.durations.outroMs, 250);
  });
  it('borne les pourcentages et le volume', () => {
    const s = sanitizeCinematicIntroSettings({ effects: { glitch: 400, flash: -3 }, audio: { volume: 1000 } });
    assert.equal(s.effects.glitch, 100);
    assert.equal(s.effects.flash, 0);
    assert.equal(s.audio.volume, 100);
  });
  it('refuse les couleurs non hexadécimales, accepte et normalise les autres', () => {
    const s = sanitizeCinematicIntroSettings({ palette: { cyan: 'red; background:url(x)', blue: '#ABCDEF' } });
    assert.equal(s.palette.cyan, '#19e6ef');
    assert.equal(s.palette.blue, '#abcdef');
  });
  it('nettoie le texte (caractères de contrôle, espaces, longueur) et garde le défaut si vide', () => {
    assert.equal(sanitizeCinematicIntroSettings({ text: '  Jean \n  Dupont\u0007 ' }).text, 'Jean Dupont');
    assert.equal(sanitizeCinematicIntroSettings({ text: '   ' }).text, 'DOSSOU Carrel');
    assert.equal(sanitizeCinematicIntroSettings({ text: 'x'.repeat(500) }).text.length, cinematicIntroLimits.text.max);
  });
  it('ne conserve que des chemins audio locaux (jamais d’URL externe ni de traversée)', () => {
    for (const bad of ['https://evil.example/a.mp3', '//evil/a.mp3', '/audio/../secret.mp3', '/audio/a/b.mp3', 'audio/a.mp3', '/audio/a.exe', '/audio/.mp3', '/audio/a.mp3?x=1', 'javascript:alert(1)']) {
      assert.equal(isValidCinematicIntroAudioPath(bad), false, bad);
    }
    assert.equal(isValidCinematicIntroAudioPath('/audio/mon-son_2.mp3'), true);
    const s = sanitizeCinematicIntroSettings({ audio: { preset: 'custom', customSrc: 'https://evil.example/a.mp3' } });
    assert.equal(s.audio.preset, 'short');
    assert.equal(s.audio.customSrc, '');
  });
  it('un sous-titre vide désactive son affichage', () => {
    assert.equal(sanitizeCinematicIntroSettings({ showSubtitle: true, subtitle: '   ' }).showSubtitle, false);
    assert.equal(sanitizeCinematicIntroSettings({ showSubtitle: true, subtitle: 'Full Stack' }).showSubtitle, true);
  });
  it('le schéma serveur accepte les valeurs par défaut', () => {
    assert.equal(cinematicIntroSchema.safeParse(cloneCinematicIntroSettings()).success, true);
  });
  it('le schéma serveur REFUSE les valeurs dangereuses', () => {
    const base = () => cloneCinematicIntroSettings();
    const mutate = (fn: (s: ReturnType<typeof base>) => void) => { const s = base(); fn(s); return cinematicIntroSchema.safeParse(s).success; };
    assert.equal(mutate((s) => { s.durations.glitchMs = -1; }), false);
    assert.equal(mutate((s) => { s.durations.glitchMs = 60_000; }), false);
    assert.equal(mutate((s) => { s.durations.lettersMs = 10; }), false);
    assert.equal(mutate((s) => { s.effects.glitch = 101; }), false);
    assert.equal(mutate((s) => { s.audio.volume = -5; }), false);
    assert.equal(mutate((s) => { s.palette.cyan = 'javascript:alert(1)'; }), false);
    assert.equal(mutate((s) => { s.text = ''; }), false);
    assert.equal(mutate((s) => { s.text = 'x'.repeat(61); }), false);
    assert.equal(mutate((s) => { s.text = 'a\u0000b'; }), false);
    assert.equal(mutate((s) => { s.audio.preset = 'custom'; s.audio.customSrc = 'https://evil.example/a.mp3'; }), false);
    assert.equal(mutate((s) => { s.audio.preset = 'custom'; s.audio.customSrc = ''; }), false);
    assert.equal(mutate((s) => { (s as { frequency: string }).frequency = 'toujours'; }), false);
    assert.equal(mutate((s) => { s.fontWeight = 650; }), false);
    assert.equal(mutate((s) => { s.audio.preset = 'custom'; s.audio.customSrc = '/audio/mon-son.mp3'; }), true);
  });
});

describe('texte : lettres une à une', () => {
  it('découpe « DOSSOU Carrel » en 2 mots et 12 caractères visibles', () => {
    const t = splitCinematicText('DOSSOU Carrel', 900);
    assert.equal(t.words.length, 2);
    assert.equal(t.visibleIndices.length, 12);
    assert.deepEqual(t.words.map((w) => w.chars.map((c) => c.ch).join('')), ['DOSSOU', 'Carrel']);
  });
  it('les délais sont croissants et la dernière lettre termine à la durée configurée', () => {
    for (const ms of [300, 900, 2500]) {
      const t = splitCinematicText('DOSSOU Carrel', ms);
      const delays = t.words.flatMap((w) => w.chars.map((c) => c.delayMs));
      assert.equal(delays[0], 0);
      for (let i = 1; i < delays.length; i += 1) assert.ok(delays[i]! >= delays[i - 1]!);
      assert.ok(Math.abs(delays.at(-1)! + t.charDurationMs - ms) <= 12, `ms=${ms}`);
    }
  });
  it('gère accents, emojis composés, espaces multiples et noms de longueurs différentes', () => {
    const t = splitCinematicText('  Élodie   Zoë 👩🏾‍💻 ', 900);
    assert.deepEqual(t.words.map((w) => w.chars.length), [6, 3, 1]);
    assert.equal(splitCinematicText('A', 900).words[0]!.chars[0]!.delayMs, 0);
    assert.equal(splitCinematicText('X'.repeat(60), 900).visibleIndices.length, 60);
  });
});

describe('chronologie', () => {
  it('somme exacte des phases', () => {
    const tl = buildCinematicTimeline(cloneCinematicIntroSettings());
    assert.equal(tl.glitchStartMs, 900);
    assert.equal(tl.holdStartMs, 2900);
    assert.equal(tl.outroStartMs, 3120);
    assert.equal(tl.totalMs, 3370);
  });
  it('mode minimal : pas de glitch, durée courte', () => {
    const tl = buildCinematicTimeline(cloneCinematicIntroSettings(), true);
    assert.equal(tl.glitchMs, 0);
    assert.ok(tl.totalMs < 1000);
  });
});

describe('plan audio / synchronisation', () => {
  const settings = () => cloneCinematicIntroSettings();
  it('par défaut : le son démarre avec le glitch, s’arrête avant la fin de la phase', () => {
    const plan = planCinematicAudio(settings(), 2000);
    assert.equal(plan.src, '/audio/intro-glitch.mp3');
    assert.equal(plan.delayMs, 0);
    assert.equal(plan.seekMs, 0);
    assert.equal(plan.stopAtMs, 1992);
    assert.equal(plan.volume, 0.65);
    assert.equal(plan.enabled, true);
    assert.ok(plan.cues.some((c) => c.type === 'stop' && c.t === 1960));
    assert.ok(plan.cues.every((c) => c.t >= 0 && c.t <= 2000));
  });
  it('glitch plus long : le son est retardé, l’arrêt net reste calé sur la stabilisation', () => {
    const plan = planCinematicAudio({ ...settings(), durations: { ...settings().durations, glitchMs: 3000 } }, 3000);
    assert.equal(plan.delayMs, 3000 - 1992);
    assert.equal(plan.stopAtMs, 3000);
    const stop = plan.cues.find((c) => c.type === 'stop')!;
    assert.equal(stop.t, 1960 + (3000 - 1992));
  });
  it('glitch plus court : on saute le début du fichier, jamais d’accélération', () => {
    const plan = planCinematicAudio(settings(), 1500);
    assert.equal(plan.delayMs, 0);
    assert.equal(plan.seekMs, 1500 < 1992 ? 1992 - 1500 : 0);
    assert.ok(plan.cues.every((c) => c.t >= 0 && c.t <= 1500));
    assert.ok(plan.cues.some((c) => c.type === 'stop'));
    assert.ok(plan.stopAtMs <= 1500);
  });
  it('fichier original : portion 0,04–2,00 s uniquement', () => {
    const plan = planCinematicAudio({ ...settings(), audio: { ...settings().audio, preset: 'source' } }, 2000);
    assert.equal(plan.src, '/audio/intro-glitch-source.mp3');
    assert.equal(plan.seekMs, 40);
    assert.equal(plan.stopAtMs, 1960);
  });
  it('fichier personnalisé : repères génériques proportionnels', () => {
    const plan = planCinematicAudio({ ...settings(), audio: { ...settings().audio, preset: 'custom', customSrc: '/audio/x.mp3' } }, 2400, 1800);
    assert.equal(plan.src, '/audio/x.mp3');
    assert.equal(plan.stopAtMs, 1800);
    assert.ok(plan.cues.every((c) => c.t <= 2400));
    assert.ok(plan.cues.some((c) => c.type === 'stop'));
  });
  it('son désactivé ou volume 0 : pas de lecture, mais les repères visuels subsistent', () => {
    const off = planCinematicAudio({ ...settings(), audio: { ...settings().audio, enabled: false } }, 2000);
    assert.equal(off.enabled, false);
    assert.ok(off.cues.length > 5);
    assert.equal(planCinematicAudio({ ...settings(), audio: { ...settings().audio, volume: 0 } }, 2000).enabled, false);
  });
});

describe('partition du glitch', () => {
  const settings = cloneCinematicIntroSettings();
  const build = (seed: number, overrides: Partial<typeof settings.effects> = {}, glitchMs = 2000) => {
    const plan = planCinematicAudio(settings, glitchMs);
    return buildGlitchScore({ glitchMs, cues: plan.cues, effects: { ...settings.effects, ...overrides }, visibleIndices: Array.from({ length: 12 }, (_, i) => i), seed });
  };

  it('est déterministe pour une graine donnée et varie d’une graine à l’autre', () => {
    assert.deepEqual(build(42), build(42));
    assert.notDeepEqual(build(42), build(43));
  });
  it('produit des images ordonnées, finies, bornées, et se termine sur un état stable', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const frames = build(seed);
      assert.ok(frames.length > 20, 'assez d’images');
      for (let i = 0; i < frames.length; i += 1) {
        const f = frames[i]!;
        if (i > 0) assert.ok(f.t > frames[i - 1]!.t, 'temps strictement croissants');
        assert.ok(f.t >= 0 && f.t <= 2000 + 100);
        for (const key of ['amp', 'rgb', 'ghost', 'shift', 'skew', 'bright', 'noise', 'flash', 'scan'] as const) assert.ok(Number.isFinite(f[key]), key);
        assert.ok(f.amp >= 0 && f.amp <= 1);
        assert.ok(f.ghost >= 0 && f.ghost <= 1);
        assert.ok(f.bright >= 0.5 && f.bright <= 1.2);
        assert.ok(f.flash >= 0 && f.flash <= 0.3, `flash ≤ 0,30 (reçu ${f.flash})`);
        assert.equal(f.slices.length, GLITCH_SLICE_COUNT);
        assert.ok(new Set(f.hidden).size === f.hidden.length && f.hidden.every((h) => h >= 0 && h < 12));
      }
      const last = frames.at(-1)!;
      assert.equal(last.amp, 0);
      assert.equal(last.rgb, 0);
      assert.equal(last.shift, 0);
      assert.equal(last.flash, 0);
      assert.deepEqual(last.hidden, []);
      assert.ok(last.slices.every((s) => s.o === 0));
      assert.ok(last.t <= 2000 + defaultCinematicIntroSettings.durations.holdMs, 'le nom est stable avant la transition CRT');
    }
  });
  it('SÉCURITÉ : jamais plus de 3 flashs plein écran par seconde (fenêtre glissante), toutes graines', () => {
    for (let seed = 1; seed <= 500; seed += 1) {
      const frames = build(seed, { flash: 100 });
      const rising = frames.filter((f, i) => f.flash >= 0.2 && (i === 0 || frames[i - 1]!.flash < 0.05)).map((f) => f.t);
      for (const start of rising) {
        const count = rising.filter((t) => t >= start && t < start + 1000).length;
        assert.ok(count <= CINEMATIC_MAX_FLASHES_PER_SECOND, `seed ${seed}: ${count} flashs en 1 s`);
      }
    }
  });
  it('flash à 0 % : aucun flash ; glitch à 0 % : aucune amplitude', () => {
    assert.ok(build(7, { flash: 0 }).every((f) => f.flash === 0));
    const calm = build(7, { glitch: 0 });
    assert.ok(calm.every((f) => f.amp === 0 && f.hidden.length === 0));
  });
  it('crescendo : l’amplitude moyenne finale dépasse celle du début', () => {
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    for (let seed = 1; seed <= 20; seed += 1) {
      const frames = build(seed);
      const early = mean(frames.filter((f) => f.t < 500).map((f) => f.amp));
      const late = mean(frames.filter((f) => f.t >= 1730 && f.t < 1960).map((f) => f.amp));
      assert.ok(late > early + 0.2, `seed ${seed}: early ${early}, late ${late}`);
    }
  });
  it('la coupure de signal masque partiellement le nom, sans le faire disparaître d’un coup à l’identique', () => {
    const frames = build(11);
    const drop = frames.find((f) => f.t >= 985 && f.t < 1040)!;
    assert.ok(drop.hidden.length >= 6, 'beaucoup de lettres masquées pendant la coupure');
    assert.ok(drop.hidden.length < 12, 'pas toutes');
  });
  it('s’adapte à d’autres durées et à d’autres noms', () => {
    for (const glitchMs of [1200, 1800, 3500]) {
      const frames = build(3, {}, glitchMs);
      assert.ok(frames.at(-1)!.t <= glitchMs + 100);
      assert.equal(frames.at(-1)!.amp, 0);
    }
  });
});

describe('fréquence d’affichage', () => {
  const s = (frequency: 'session' | 'always' | 'first-visit', revision = 1) => ({ ...cloneCinematicIntroSettings(), frequency, revision });
  it('session : une fois par session, mémorisé dans sessionStorage uniquement', () => {
    const storages = { session: memoryStorage(), local: memoryStorage() };
    assert.equal(decideCinematicIntroStart(s('session'), { prefersReducedMotion: false, storages }), 'play');
    markCinematicIntroSeen(s('session'), storages);
    assert.equal(decideCinematicIntroStart(s('session'), { prefersReducedMotion: false, storages }), 'skip');
    assert.equal(storages.local.data.size, 0);
  });
  it('always : toujours joué, rien n’est mémorisé', () => {
    const storages = { session: memoryStorage(), local: memoryStorage() };
    markCinematicIntroSeen(s('always'), storages);
    assert.equal(storages.session.data.size + storages.local.data.size, 0);
    assert.equal(decideCinematicIntroStart(s('always'), { prefersReducedMotion: false, storages }), 'play');
  });
  it('first-visit : mémorisé dans localStorage ; une nouvelle révision rejoue pour tous', () => {
    const storages = { session: memoryStorage(), local: memoryStorage() };
    markCinematicIntroSeen(s('first-visit'), storages);
    assert.equal(hasSeenCinematicIntro(s('first-visit'), storages), true);
    assert.equal(hasSeenCinematicIntro(s('first-visit', 2), storages), false);
    assert.equal(storages.session.data.size, 0);
  });
  it('désactivée → skip ; stockage indisponible → joué sans erreur', () => {
    const storages = { session: memoryStorage(), local: memoryStorage() };
    assert.equal(decideCinematicIntroStart({ ...s('session'), enabled: false }, { prefersReducedMotion: false, storages }), 'skip');
    const broken: StorageLike = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    assert.equal(decideCinematicIntroStart(s('session'), { prefersReducedMotion: false, storages: { session: broken } }), 'play');
    assert.doesNotThrow(() => markCinematicIntroSeen(s('session'), { session: broken }));
  });
  it('prefers-reduced-motion : révélation immédiate ou affichage minimal', () => {
    const storages = { session: memoryStorage(), local: memoryStorage() };
    assert.equal(decideCinematicIntroStart({ ...s('session'), reducedMotion: 'skip' }, { prefersReducedMotion: true, storages }), 'skip');
    assert.equal(decideCinematicIntroStart({ ...s('session'), reducedMotion: 'minimal' }, { prefersReducedMotion: true, storages }), 'minimal');
  });
});

describe('script de démarrage inline (<head>)', () => {
  const run = (script: string, env: { session?: Record<string, string>; local?: Record<string, string>; reduced?: boolean }) => {
    const attrs: Record<string, string> = {};
    const store = (data: Record<string, string> = {}) => ({ getItem: (k: string) => data[k] ?? null });
    const fakeWindow = { matchMedia: () => ({ matches: !!env.reduced }) };
    new Function('document', 'sessionStorage', 'localStorage', 'window', 'matchMedia', script)(
      { documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; } } },
      store(env.session), store(env.local), fakeWindow, fakeWindow.matchMedia,
    );
    return attrs['data-cinematic-intro'];
  };
  it('pose pending/skip selon le stockage et le mouvement réduit', () => {
    const settings = cloneCinematicIntroSettings();
    const script = buildCinematicBootScript(settings);
    assert.equal(run(script, {}), 'pending');
    assert.equal(run(script, { session: { 'carrelfolio:intro:r1': '1' } }), 'skip');
    assert.equal(run(script, { reduced: true }), 'skip');
    assert.equal(run(buildCinematicBootScript({ ...settings, reducedMotion: 'minimal' }), { reduced: true }), 'pending');
    assert.equal(run(buildCinematicBootScript({ ...settings, frequency: 'first-visit' }), { local: { 'carrelfolio:intro:r1': '1' } }), 'skip');
    assert.equal(run(buildCinematicBootScript({ ...settings, frequency: 'always' }), { session: { 'carrelfolio:intro:r1': '1' } }), 'pending');
    assert.equal(run(buildCinematicBootScript({ ...settings, revision: 3 }), { session: { 'carrelfolio:intro:r1': '1' } }), 'pending');
  });
  it('n’embarque aucune valeur libre (pas d’injection possible)', () => {
    const script = buildCinematicBootScript({ frequency: '"};alert(1);//' as never, revision: '1;alert(1)' as never, reducedMotion: 'skip' });
    assert.doesNotMatch(script, /alert/);
    assert.doesNotMatch(script, /<\/script/i);
  });
});
