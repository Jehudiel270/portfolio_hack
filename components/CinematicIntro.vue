<script setup lang="ts">
/**
 * Carrelfolio — Introduction cinématique « DOSSOU Carrel ».
 *
 * Séquence : lettres une à une → glitch numérique synchronisé avec le son → maintien → extinction CRT.
 * Le vrai portfolio est déjà rendu derrière l'overlay ; la transition le révèle sans recharger la page.
 *
 * Usage public (app.vue)      : <CinematicIntro :settings="introSettings" />
 * Usage Dashboard (aperçu)    : <CinematicIntro preview :settings="formValues" @done="…" />
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { RotateCcw, Volume2 } from 'lucide-vue-next';
import CinematicIntroText from '~/components/CinematicIntroText.vue';
import { splitCinematicText, useCinematicIntroRunner } from '~/composables/useCinematicIntro';
import { sanitizeCinematicIntroSettings, type CinematicIntroSettings } from '~/types/cinematic-intro';

const props = withDefaults(defineProps<{ settings: CinematicIntroSettings; preview?: boolean }>(), { preview: false });
const emit = defineEmits<{ done: [info: { skipped: boolean; reason: 'completed' | 'skipped' | 'not-needed' }] }>();

const root = ref<HTMLElement | null>(null);
const config = computed(() => sanitizeCinematicIntroSettings(props.settings));
const text = computed(() => splitCinematicText(config.value.text, config.value.durations.lettersMs));

const runner = useCinematicIntroRunner({
  settings: () => props.settings,
  root,
  preview: props.preview,
  onFinish: (info) => emit('done', info),
});
const { phase, armed, soundBlocked, minimalMode, entryGateVisible } = runner;

/** Rendu serveur : l'overlay est présent dès le premier octet (pas de flash du site), puis le client décide. */
const showOverlay = computed(() => phase.value !== 'done' && (props.preview || config.value.enabled));
const showReplay = computed(() => !props.preview && config.value.replayButton && phase.value === 'done');

const overlayStyle = computed(() => {
  const c = config.value;
  const p = c.palette;
  return {
    '--cin-bg': p.background,
    '--cin-text': p.text,
    '--cin-cyan': p.cyan,
    '--cin-blue': p.blue,
    '--cin-violet': p.violet,
    '--cin-split': p.split,
    '--cin-weight': String(c.fontWeight),
    '--cin-font': c.fontFamily === 'dm-mono'
      ? "var(--mono, 'DM Mono', 'SFMono-Regular', Consolas, monospace)"
      : "var(--sans, 'Space Grotesk', Inter, system-ui, sans-serif)",
    '--cin-letters': `${c.durations.lettersMs}ms`,
    '--cin-char': `${text.value.charDurationMs}ms`,
    '--cin-glitch': `${c.durations.glitchMs}ms`,
    '--cin-outro': `${c.durations.outroMs}ms`,
    '--cin-scan': String(c.effects.scanlines / 100),
  };
});

onMounted(() => runner.mount());
onBeforeUnmount(() => runner.dispose());
</script>

<template>
  <Teleport to="body" :disabled="!preview">
    <div
      v-if="showOverlay"
      ref="root"
      class="cin-intro"
      :class="[`is-${phase}`, { 'is-armed': armed, 'is-minimal': minimalMode, 'is-preview': preview }]"
      :style="overlayStyle"
      role="dialog"
      aria-modal="true"
      :aria-label="`Introduction du portfolio : ${config.text}`"
    >
      <div class="cin-screen">
        <div class="cin-bg" aria-hidden="true"></div>

        <div v-if="entryGateVisible" class="cin-entry-gate" role="group" aria-label="Choisir comment entrer">
          <div class="cin-entry-mark" aria-hidden="true"><span></span></div>
          <h1>Entrer dans le portfolio</h1>
          <div class="cin-entry-actions">
            <button class="cin-entry-button cin-entry-button--sound" type="button" @click="runner.startWithSound()">
              <Volume2 :size="18" aria-hidden="true" /><span>Avec le son</span>
            </button>
            <button class="cin-entry-button" type="button" @click="runner.startWithoutSound()">
              <span>Sans son</span>
            </button>
          </div>
          <button class="cin-entry-skip" type="button" @click="runner.skip()">Passer l’introduction</button>
        </div>

        <div v-else class="cin-stage">
          <div class="cin-name" aria-hidden="true">
            <div class="cin-layer cin-ghost cin-ghost--m"><CinematicIntroText :words="text.words" /></div>
            <div class="cin-layer cin-ghost cin-ghost--c"><CinematicIntroText :words="text.words" /></div>
            <div class="cin-layer cin-main"><CinematicIntroText :words="text.words" animated /></div>
            <div
              v-for="n in 6"
              :key="n"
              class="cin-layer cin-slice"
              :class="n % 2 ? 'cin-slice--a' : 'cin-slice--b'"
            ><CinematicIntroText :words="text.words" /></div>
          </div>
          <p v-if="config.showSubtitle && config.subtitle" class="cin-sub">{{ config.subtitle }}</p>
        </div>

        <div class="cin-noise" aria-hidden="true"></div>
        <div class="cin-scan" aria-hidden="true"></div>
        <div class="cin-roll" aria-hidden="true"></div>
        <div class="cin-vignette" aria-hidden="true"></div>
        <div class="cin-flash" aria-hidden="true"></div>
      </div>

      <div class="cin-line" aria-hidden="true"></div>

      <div v-if="!entryGateVisible" class="cin-controls">
        <button
          v-if="soundBlocked && phase === 'glitch'"
          class="cin-chip cin-sound"
          type="button"
          @click="runner.enableSound()"
        ><Volume2 :size="14" aria-hidden="true" /> Activer le son</button>
        <button class="cin-chip cin-skip" type="button" aria-label="Passer l’introduction" @click="runner.skip()">Passer</button>
      </div>
    </div>
  </Teleport>

  <button v-if="showReplay" class="cin-replay" type="button" aria-label="Rejouer l’introduction avec le son" @click="runner.replay()">
    <RotateCcw :size="13" aria-hidden="true" /><span>Rejouer l’intro</span>
  </button>
</template>

<style>
/* Les classes sont toutes préfixées « cin- » : le bloc n'est volontairement pas « scoped »
   afin que les couches rendues par CinematicIntroText reçoivent les mêmes règles. */

/* Avant hydratation : un visiteur déjà passé ne voit jamais l'overlay (posé par le script inline du <head>). */
html[data-cinematic-intro='skip'] .cin-intro { display: none !important; }
html[data-cinematic-intro='running'] { overflow: hidden; }

.cin-intro {
  --cin-amp: 0; --cin-rgb: 0em; --cin-ghost: 0; --cin-shift: 0em; --cin-skew: 0deg; --cin-bright: 1;
  --cin-noise: 0.02; --cin-nx: 0px; --cin-ny: 0px; --cin-flash: 0; --cin-scan-k: 0.7;
  position: fixed; inset: 0; z-index: 100000; isolation: isolate; overflow: hidden;
  color: var(--cin-text); font-family: var(--cin-font);
}
/* Filet de sécurité : si le JavaScript ne prend jamais la main (hydratation en échec, réseau très lent),
   l'overlay se retire seul après 9 s au lieu de bloquer le site. */
.cin-intro:not(.is-armed) { animation: cin-failsafe 1ms linear 9s forwards; }
@keyframes cin-failsafe { to { visibility: hidden; pointer-events: none; } }

.cin-screen { position: absolute; inset: 0; display: grid; place-items: center; background: var(--cin-bg); transform-origin: 50% 50%; }
.cin-bg {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(60% 46% at 50% 50%, color-mix(in srgb, var(--cin-blue) 15%, transparent), transparent 72%),
    radial-gradient(38% 34% at 80% 16%, color-mix(in srgb, var(--cin-violet) 13%, transparent), transparent 70%);
}
.cin-entry-gate {
  position: relative; z-index: 3; width: min(680px, calc(100vw - 40px)); display: grid; justify-items: center; gap: 22px;
  text-align: center; padding: clamp(24px, 5vw, 44px); border: 1px solid color-mix(in srgb, var(--cin-cyan) 32%, transparent);
  border-radius: 24px; background: color-mix(in srgb, var(--cin-bg) 88%, transparent); backdrop-filter: blur(18px);
  box-shadow: 0 24px 90px color-mix(in srgb, var(--cin-blue) 18%, transparent), inset 0 1px 0 color-mix(in srgb, var(--cin-text) 8%, transparent);
}
.cin-entry-mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--cin-cyan) 55%, transparent); }
.cin-entry-mark span { width: 9px; height: 9px; border-radius: 50%; background: var(--cin-cyan); box-shadow: 0 0 18px var(--cin-cyan); }
.cin-entry-gate h1 { margin: 0; font-size: clamp(1.35rem, 4vw, 2.25rem); line-height: 1.1; letter-spacing: -0.03em; }
.cin-entry-actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cin-entry-button { min-height: 56px; border: 1px solid color-mix(in srgb, var(--cin-text) 18%, transparent); border-radius: 14px; background: color-mix(in srgb, var(--cin-text) 7%, transparent); color: var(--cin-text); display: inline-flex; align-items: center; justify-content: center; gap: 10px; font: 700 0.95rem var(--cin-font); cursor: pointer; transition: transform 160ms ease, border-color 160ms ease, background 160ms ease; }
.cin-entry-button--sound { border-color: color-mix(in srgb, var(--cin-cyan) 58%, transparent); background: color-mix(in srgb, var(--cin-cyan) 12%, transparent); }
.cin-entry-button:hover, .cin-entry-button:focus-visible { transform: translateY(-2px); border-color: var(--cin-cyan); outline: none; }
.cin-entry-skip { border: 0; background: transparent; color: color-mix(in srgb, var(--cin-text) 62%, transparent); font: 600 0.78rem var(--cin-font); cursor: pointer; padding: 6px; }
.cin-entry-skip:hover, .cin-entry-skip:focus-visible { color: var(--cin-text); }
@media (max-width: 520px) { .cin-entry-actions { grid-template-columns: 1fr; } .cin-entry-gate { gap: 16px; border-radius: 18px; } }

.cin-stage { position: relative; z-index: 2; display: grid; justify-items: center; gap: clamp(10px, 2vw, 22px); padding: 0 5vw; max-width: 100%; }

/* ---------- Nom ---------- */
.cin-name {
  position: relative; max-width: min(92vw, 1500px);
  font-size: clamp(2.1rem, 10.2vw, 6.9rem); font-weight: var(--cin-weight);
  letter-spacing: 0.045em; line-height: 1.08; text-align: center; text-wrap: balance;
  font-kerning: none; font-variant-ligatures: none;
}
.cin-intro.is-glitch .cin-name, .cin-intro.is-hold .cin-name {
  transform: translate3d(var(--cin-shift), 0, 0) skewX(var(--cin-skew));
  filter: brightness(var(--cin-bright));
}
.cin-layer { display: block; }
.cin-layer:not(.cin-main) { position: absolute; inset: 0; pointer-events: none; }
.cin-word { display: inline-block; white-space: nowrap; }
.cin-char { display: inline-block; position: relative; white-space: pre; }

.cin-main {
  color: var(--cin-text);
  text-shadow: 0 0 0.2em color-mix(in srgb, var(--cin-cyan) 38%, transparent), 0 0 0.9em color-mix(in srgb, var(--cin-blue) 26%, transparent);
}
.cin-main .cin-char { opacity: 0; }
.cin-intro:not(.is-pending) .cin-main .cin-char { animation: cin-char-in var(--cin-char) cubic-bezier(0.16, 0.84, 0.3, 1) both; }
.cin-main .cin-char::after {
  content: attr(data-c); position: absolute; inset: 0; color: var(--cin-cyan); opacity: 0; pointer-events: none; filter: blur(0.09em);
}
.cin-intro:not(.is-pending) .cin-main .cin-char::after { animation: cin-char-glow calc(var(--cin-char) * 1.5) ease-out both; animation-delay: inherit; }
.cin-main .cin-char.is-off { visibility: hidden; }
@keyframes cin-char-in {
  0% { opacity: 0; transform: translate3d(-0.03em, 0.16em, 0) scale(0.96); }
  60% { opacity: 1; }
  100% { opacity: 1; transform: none; }
}
@keyframes cin-char-glow { 0% { opacity: 0; } 35% { opacity: 0.95; } 100% { opacity: 0; } }

/* Mode minimal (prefers-reduced-motion) : nom statique, aucune animation de lettres. */
.cin-intro.is-minimal .cin-main .cin-char { opacity: 1; animation: none; }
.cin-intro.is-minimal .cin-main .cin-char::after { display: none; }

/* ---------- Séparation RVB ---------- */
.cin-ghost { opacity: 0; mix-blend-mode: screen; }
.cin-intro.is-glitch .cin-ghost, .cin-intro.is-hold .cin-ghost { opacity: var(--cin-ghost); will-change: transform, opacity; }
.cin-ghost--m { color: var(--cin-split); transform: translate3d(calc(var(--cin-rgb) * -1), 0, 0); }
.cin-ghost--c { color: var(--cin-cyan); transform: translate3d(var(--cin-rgb), 0, 0); }

/* ---------- Tranches horizontales (découpes) ---------- */
.cin-slice {
  visibility: hidden; opacity: var(--o, 0); color: var(--cin-text);
  clip-path: inset(var(--y, 0%) 0 calc(100% - var(--y, 0%) - var(--h, 0%)) 0);
  transform: translate3d(var(--x, 0em), 0, 0);
}
.cin-slice--b { color: var(--cin-cyan); }
.cin-intro.is-glitch .cin-slice, .cin-intro.is-hold .cin-slice { visibility: visible; }

/* ---------- Sous-titre facultatif ---------- */
.cin-sub {
  margin: 0; opacity: 0; text-align: center; text-transform: uppercase; letter-spacing: 0.32em;
  font: 500 clamp(0.68rem, 1.6vw, 0.9rem) / 1.4 var(--mono, 'DM Mono', monospace);
  color: color-mix(in srgb, var(--cin-text) 70%, transparent);
}
.cin-intro:not(.is-pending) .cin-sub { animation: cin-sub-in calc(var(--cin-letters) * 0.5) ease-out calc(var(--cin-letters) * 0.55) both; }
.cin-intro.is-minimal .cin-sub { animation: none; opacity: 1; }
@keyframes cin-sub-in { from { opacity: 0; transform: translate3d(0, 0.4em, 0); } to { opacity: 1; transform: none; } }

/* ---------- Texture : parasites, scanlines, balayage, vignette, flash ---------- */
.cin-noise, .cin-scan, .cin-roll, .cin-vignette, .cin-flash { position: absolute; pointer-events: none; }
.cin-noise {
  inset: -64px; opacity: 0; mix-blend-mode: screen; background-size: 200px 200px; background-position: var(--cin-nx) var(--cin-ny);
  background-image: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.cin-intro.is-letters .cin-noise { opacity: 0.03; }
.cin-intro.is-glitch .cin-noise, .cin-intro.is-hold .cin-noise { opacity: var(--cin-noise); }
.cin-scan {
  inset: 0; opacity: calc(var(--cin-scan) * 0.62 * var(--cin-scan-k));
  background: repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0) 2px, rgba(0, 0, 0, 0.58) 2px, rgba(0, 0, 0, 0.58) 3px);
}
.cin-roll {
  left: 0; right: 0; top: -30%; height: 28%; opacity: 0;
  background: linear-gradient(to bottom, transparent, color-mix(in srgb, var(--cin-cyan) 16%, transparent) 50%, transparent);
}
.cin-intro.is-glitch .cin-roll, .cin-intro.is-hold .cin-roll { opacity: var(--cin-scan); animation: cin-roll var(--cin-glitch) linear both; }
@keyframes cin-roll { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, 460%, 0); } }
.cin-vignette { inset: 0; background: radial-gradient(ellipse at center, transparent 52%, rgba(0, 0, 0, 0.6) 100%); }
.cin-flash {
  inset: 0; opacity: var(--cin-flash); mix-blend-mode: screen;
  background: radial-gradient(circle at 50% 50%, #fff, color-mix(in srgb, var(--cin-cyan) 70%, #fff));
}

/* ---------- Transition CRT : effondrement vertical, ligne lumineuse, extinction ---------- */
.cin-line {
  position: absolute; left: 0; right: 0; top: 50%; height: 3px; margin-top: -1.5px; opacity: 0; pointer-events: none;
  background: linear-gradient(90deg, transparent, var(--cin-cyan) 18%, #fff 50%, var(--cin-cyan) 82%, transparent);
  box-shadow: 0 0 18px 2px color-mix(in srgb, var(--cin-cyan) 70%, transparent), 0 0 60px 6px color-mix(in srgb, var(--cin-blue) 45%, transparent);
}
.cin-intro.is-outro .cin-screen { animation: cin-crt-off var(--cin-outro) cubic-bezier(0.55, 0, 0.8, 0.4) both; }
.cin-intro.is-outro .cin-line { animation: cin-line var(--cin-outro) cubic-bezier(0.4, 0, 0.6, 1) both; }
.cin-intro.is-outro .cin-controls { opacity: 0; transition: opacity 80ms linear; }
@keyframes cin-crt-off {
  0% { transform: scale3d(1, 1, 1); opacity: 1; }
  46% { transform: scale3d(1, 0.008, 1); opacity: 1; }
  47%, 100% { transform: scale3d(1, 0.008, 1); opacity: 0; }
}
@keyframes cin-line {
  0%, 38% { opacity: 0; transform: scaleX(1); }
  46% { opacity: 1; transform: scaleX(1); }
  72% { opacity: 1; transform: scaleX(0.5); }
  100% { opacity: 0; transform: scaleX(0); }
}
.cin-intro.is-minimal.is-outro .cin-screen { animation: cin-fade var(--cin-outro) ease-out both; }
.cin-intro.is-minimal .cin-line { display: none; }
@keyframes cin-fade { to { opacity: 0; } }

/* ---------- Contrôles ---------- */
.cin-controls {
  position: absolute; z-index: 5; left: 0; right: 0; bottom: max(16px, env(safe-area-inset-bottom));
  display: flex; justify-content: space-between; gap: 12px; padding: 0 max(16px, 3vw); pointer-events: none;
}
.cin-chip, .cin-replay {
  display: inline-flex; align-items: center; gap: 7px; min-height: 36px; padding: 0 14px; cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--cin-cyan, #19e6ef) 38%, transparent); border-radius: 8px;
  background: color-mix(in srgb, var(--cin-bg, #030711) 72%, transparent); backdrop-filter: blur(6px);
  color: color-mix(in srgb, var(--cin-text, #e5f2ff) 84%, transparent);
  font: 500 12px var(--mono, 'DM Mono', monospace); letter-spacing: 0.08em; transition: border-color 0.15s, color 0.15s, opacity 0.15s;
}
.cin-chip { pointer-events: auto; }
.cin-skip { margin-left: auto; }
.cin-chip:hover, .cin-chip:focus-visible, .cin-replay:hover, .cin-replay:focus-visible { border-color: var(--cin-cyan, #19e6ef); color: var(--cin-cyan, #19e6ef); }
.cin-chip:focus-visible, .cin-replay:focus-visible { outline: 2px solid var(--cin-cyan, #19e6ef); outline-offset: 3px; }
.cin-replay {
  --cin-bg: #030711; --cin-text: #e5f2ff; --cin-cyan: #19e6ef;
  position: fixed; left: 14px; bottom: 14px; z-index: 30; min-height: 32px; padding: 0 11px; font-size: 11px; opacity: 0.55;
}
.cin-replay:hover, .cin-replay:focus-visible { opacity: 1; }
@media print { .cin-intro, .cin-replay { display: none !important; } }
</style>
