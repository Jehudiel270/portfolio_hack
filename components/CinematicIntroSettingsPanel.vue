<script setup lang="ts">
/**
 * Dashboard — panneau « Introduction cinématique ».
 * Se branche dans l'onglet Réglages d'admin.vue : <CinematicIntroSettingsPanel v-model="siteSettings.cinematicIntro" />
 * Il modifie l'objet réactif du formulaire ; l'enregistrement reste celui du bouton « Enregistrer les réglages »
 * (PUT /api/admin/settings, protégé par session admin + jeton CSRF).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Play, RotateCcw, Square, Volume2 } from 'lucide-vue-next';
import CinematicIntro from '~/components/CinematicIntro.vue';
import { buildCinematicTimeline } from '~/composables/useCinematicIntro';
import {
  cinematicIntroAudioSources,
  cinematicIntroFonts,
  cinematicIntroFrequencies,
  cinematicIntroLimits as limits,
  cinematicIntroWeights,
  cloneCinematicIntroSettings,
  isValidCinematicIntroAudioPath,
  sanitizeCinematicIntroSettings,
  type CinematicIntroSettings,
} from '~/types/cinematic-intro';

const model = defineModel<CinematicIntroSettings>({ required: true });

interface NumberField { key: string; label: string; unit: string; min: number; max: number; step: number }
const durationFields: NumberField[] = [
  { key: 'lettersMs', label: 'Apparition des lettres', unit: 'ms', ...limits.lettersMs },
  { key: 'glitchMs', label: 'Glitch numérique', unit: 'ms', ...limits.glitchMs },
  { key: 'holdMs', label: 'Maintien du nom stabilisé', unit: 'ms', ...limits.holdMs },
  { key: 'outroMs', label: 'Transition CRT finale', unit: 'ms', ...limits.outroMs },
];
const effectFields: NumberField[] = [
  { key: 'rgbSplit', label: 'Séparation RVB', unit: '%', ...limits.percent },
  { key: 'distortion', label: 'Distorsions et découpes', unit: '%', ...limits.percent },
  { key: 'scanlines', label: 'Scanlines CRT', unit: '%', ...limits.percent },
  { key: 'flash', label: 'Flashs lumineux (0 = aucun)', unit: '%', ...limits.percent },
];
const paletteFields: { key: keyof CinematicIntroSettings['palette']; label: string }[] = [
  { key: 'background', label: 'Fond' },
  { key: 'text', label: 'Texte' },
  { key: 'cyan', label: 'Cyan' },
  { key: 'blue', label: 'Bleu' },
  { key: 'violet', label: 'Violet' },
  { key: 'split', label: 'Magenta (RVB)' },
];

const durations = computed(() => model.value.durations as unknown as Record<string, number>);
const effects = computed(() => model.value.effects as unknown as Record<string, number>);

/** Borne les valeurs saisies (aucun nombre négatif, aucune durée extrême) — le serveur revalide de toute façon. */
function normalize() {
  const clean = sanitizeCinematicIntroSettings(model.value);
  const { preset, customSrc } = model.value.audio; // le chemin audio reste tel que saisi : l'erreur est affichée, pas masquée
  Object.assign(model.value, { ...clean, audio: { ...clean.audio, preset, customSrc } });
}

/* ------------------------------ Résumé de durée ------------------------------ */
const timeline = computed(() => buildCinematicTimeline(sanitizeCinematicIntroSettings(model.value)));
const totalSeconds = computed(() => (timeline.value.totalMs / 1000).toFixed(2).replace('.', ','));
const syncNote = computed(() => {
  if (model.value.audio.preset === 'custom') return 'Fichier personnalisé : repères génériques proportionnels, lecture depuis le début, fondu de sortie à la fin du glitch.';
  const span = cinematicIntroAudioSources[model.value.audio.preset === 'source' ? 'source' : 'short'].spanMs;
  const delta = model.value.durations.glitchMs - span;
  if (Math.abs(delta) <= 80) return `Durée calée sur le son (≈ ${(span / 1000).toFixed(2).replace('.', ',')} s) : le son démarre avec le glitch.`;
  return delta > 0
    ? `Glitch plus long que le son : le son démarre ${delta} ms après le début du glitch (montée visuelle silencieuse) pour que son arrêt net coïncide avec la stabilisation.`
    : `Glitch plus court que le son : les ${-delta} premières ms du fichier sont sautées (jamais d’accélération) pour garder l’arrêt net synchronisé.`;
});

/* ------------------------------------ Audio ------------------------------------ */
const resolvedSrc = computed(() => {
  const { preset, customSrc } = model.value.audio;
  if (preset === 'custom') return isValidCinematicIntroAudioPath(customSrc) ? customSrc : '';
  return cinematicIntroAudioSources[preset === 'source' ? 'source' : 'short'].src;
});
const customError = computed(() => {
  const { preset, customSrc } = model.value.audio;
  if (preset !== 'custom') return '';
  if (!customSrc) return 'Saisis un chemin local, par exemple /audio/mon-son.mp3.';
  return isValidCinematicIntroAudioPath(customSrc) ? '' : 'Chemin invalide : utilise un fichier de public/audio (mp3, ogg, wav, m4a, webm), sans URL externe. À l’enregistrement, la version courte sera utilisée.';
});
const availability = ref<'idle' | 'checking' | 'ok' | 'missing'>('idle');
const audioMessage = ref('');
let checkTimer = 0;
async function checkAvailability() {
  const src = resolvedSrc.value;
  if (!src) { availability.value = 'idle'; return; }
  availability.value = 'checking';
  try {
    const response = await fetch(src, { method: 'HEAD', cache: 'no-store' });
    availability.value = response.ok ? 'ok' : 'missing';
  } catch { availability.value = 'missing'; }
}
watch(resolvedSrc, () => { window.clearTimeout(checkTimer); checkTimer = window.setTimeout(checkAvailability, 350); });

let sample: HTMLAudioElement | null = null;
const samplePlaying = ref(false);
function stopSample() {
  if (sample) { try { sample.pause(); sample.removeAttribute('src'); sample.load(); } catch { /* déjà libéré */ } }
  sample = null;
  samplePlaying.value = false;
}
function toggleSample() {
  if (samplePlaying.value) { stopSample(); return; }
  audioMessage.value = '';
  const src = resolvedSrc.value;
  if (!src) { audioMessage.value = 'Aucun fichier audio valide à écouter.'; return; }
  const audio = new Audio(src);
  audio.volume = Math.min(1, Math.max(0, model.value.audio.volume / 100));
  audio.addEventListener('ended', stopSample, { once: true });
  audio.addEventListener('error', () => { audioMessage.value = `Fichier introuvable ou illisible : ${src}`; stopSample(); }, { once: true });
  sample = audio;
  samplePlaying.value = true;
  audio.play().catch((error: { name?: string }) => {
    audioMessage.value = error?.name === 'NotAllowedError' ? 'Le navigateur a bloqué la lecture : clique de nouveau sur « Écouter ».' : 'Lecture impossible pour ce fichier.';
    stopSample();
  });
}

/* ------------------------------ Actions du panneau ------------------------------ */
const previewing = ref(false);
const previewSettings = ref<CinematicIntroSettings>(cloneCinematicIntroSettings());
function startPreview() {
  stopSample();
  normalize();
  // Capture des valeurs du FORMULAIRE (même non enregistrées). Ne touche ni la fréquence ni la session.
  previewSettings.value = sanitizeCinematicIntroSettings({ ...model.value, enabled: true });
  previewing.value = true;
}
const notice = ref('');
function restoreDefaults() {
  if (!window.confirm('Restaurer les valeurs par défaut de l’introduction cinématique ?\n\nTes réglages actuels de l’intro seront remplacés dans le formulaire (ils ne sont enregistrés qu’en cliquant sur « Enregistrer les réglages »).')) return;
  stopSample();
  const revision = model.value.revision; // conserver la révision évite de rejouer l'intro à tout le monde
  Object.assign(model.value, cloneCinematicIntroSettings(), { revision });
  notice.value = 'Valeurs par défaut restaurées dans le formulaire. Pense à enregistrer.';
}
function resetForAllVisitors() {
  model.value.revision = Math.min(limits.revision.max, model.value.revision + 1);
  notice.value = 'Tous les visiteurs reverront l’intro après l’enregistrement des réglages.';
}

onMounted(() => { void checkAvailability(); });
onBeforeUnmount(() => { stopSample(); window.clearTimeout(checkTimer); });
</script>

<template>
  <section class="window public-background-settings cin-set" aria-labelledby="cin-set-title">
    <h2 id="cin-set-title">Introduction cinématique du site public</h2>
    <p class="muted">Lettres une à une, glitch numérique synchronisé avec le son, puis extinction CRT. Durée totale actuelle : <strong>≈ {{ totalSeconds }} s</strong>. Jamais affichée dans <code>/admin</code>.</p>

    <!-- Activation et fréquence -->
    <fieldset class="cin-set-group">
      <legend>Activation et fréquence</legend>
      <div class="public-backdrop-controls">
        <label class="backdrop-toggle-option"><input v-model="model.enabled" type="checkbox"><span>Activer l’introduction</span><small>Décochée : le site s’affiche directement, sans overlay.</small></label>
        <label class="backdrop-toggle-option"><input v-model="model.replayButton" type="checkbox"><span>Bouton « Rejouer l’intro »</span><small>Discret, sur le site ; fonctionne aussi quand l’intro automatique est désactivée.</small></label>
      </div>
      <div class="cin-set-fields">
        <div class="field"><label for="cin-frequency">Fréquence d’affichage</label>
          <select id="cin-frequency" v-model="model.frequency"><option v-for="f in cinematicIntroFrequencies" :key="f.value" :value="f.value">{{ f.label }}</option></select>
          <small class="muted">{{ cinematicIntroFrequencies.find((f) => f.value === model.frequency)?.hint }}</small>
        </div>
        <div class="field"><label for="cin-reduced">Si le visiteur demande moins d’animations</label>
          <select id="cin-reduced" v-model="model.reducedMotion"><option value="skip">Révéler le site immédiatement</option><option value="minimal">Afficher le nom en statique, bref</option></select>
        </div>
        <div class="field"><label>Visiteurs ayant déjà vu l’intro</label>
          <button class="button secondary" type="button" @click="resetForAllVisitors"><RotateCcw :size="14" /> Faire revoir l’intro à tous</button>
          <small class="muted">Révision n°{{ model.revision }} — s’applique après l’enregistrement.</small>
        </div>
      </div>
    </fieldset>

    <!-- Identité -->
    <fieldset class="cin-set-group">
      <legend>Identité</legend>
      <div class="cin-set-fields">
        <div class="field full"><label for="cin-text">Texte principal (indépendant du nom de profil)</label>
          <input id="cin-text" v-model="model.text" type="text" :maxlength="limits.text.max" autocomplete="off" @change="normalize">
        </div>
        <div class="field"><label for="cin-font">Police</label>
          <select id="cin-font" v-model="model.fontFamily"><option v-for="f in cinematicIntroFonts" :key="f.value" :value="f.value">{{ f.label }}</option></select>
        </div>
        <div class="field"><label for="cin-weight">Graisse</label>
          <select id="cin-weight" v-model.number="model.fontWeight"><option v-for="w in cinematicIntroWeights" :key="w" :value="w">{{ w }}</option></select>
        </div>
        <label class="backdrop-toggle-option"><input v-model="model.showSubtitle" type="checkbox"><span>Texte secondaire</span><small>Petite ligne technique sous le nom.</small></label>
        <div v-if="model.showSubtitle" class="field"><label for="cin-sub">Texte secondaire</label>
          <input id="cin-sub" v-model="model.subtitle" type="text" :maxlength="limits.subtitle.max" autocomplete="off" @change="normalize">
        </div>
      </div>
    </fieldset>

    <!-- Durées -->
    <fieldset class="cin-set-group">
      <legend>Durées</legend>
      <div class="cin-set-ranges">
        <div v-for="f in durationFields" :key="f.key" class="cin-set-range">
          <label :for="`cin-d-${f.key}`">{{ f.label }}</label>
          <div class="cin-set-range-row">
            <input v-model.number="durations[f.key]" type="range" :min="f.min" :max="f.max" :step="f.step" :aria-label="`${f.label} (curseur)`">
            <span class="cin-set-num"><input :id="`cin-d-${f.key}`" v-model.number="durations[f.key]" type="number" :min="f.min" :max="f.max" :step="f.step" @change="normalize"><em>{{ f.unit }}</em></span>
          </div>
        </div>
      </div>
      <small class="muted cin-set-sync">{{ syncNote }}</small>
    </fieldset>

    <!-- Effets -->
    <fieldset class="cin-set-group">
      <legend>Effets visuels</legend>
      <div class="cin-set-ranges">
        <div class="cin-set-range">
          <label for="cin-e-glitch">Intensité du glitch</label>
          <div class="cin-set-range-row">
            <input v-model.number="model.effects.glitch" type="range" :min="limits.percent.min" :max="limits.percent.max" :step="limits.percent.step" aria-label="Intensité du glitch (curseur)">
            <span class="cin-set-num"><input id="cin-e-glitch" v-model.number="model.effects.glitch" type="number" min="0" max="100" step="5" @change="normalize"><em>%</em></span>
          </div>
        </div>
      </div>
      <details class="cin-set-advanced">
        <summary>Réglages avancés des effets et palette</summary>
        <div class="cin-set-ranges">
          <div v-for="f in effectFields" :key="f.key" class="cin-set-range">
            <label :for="`cin-e-${f.key}`">{{ f.label }}</label>
            <div class="cin-set-range-row">
              <input v-model.number="effects[f.key]" type="range" :min="f.min" :max="f.max" :step="f.step" :aria-label="`${f.label} (curseur)`">
              <span class="cin-set-num"><input :id="`cin-e-${f.key}`" v-model.number="effects[f.key]" type="number" :min="f.min" :max="f.max" :step="f.step" @change="normalize"><em>{{ f.unit }}</em></span>
            </div>
          </div>
        </div>
        <div class="cin-set-palette">
          <label v-for="c in paletteFields" :key="c.key"><span>{{ c.label }}</span><input v-model="model.palette[c.key]" type="color" :aria-label="`Couleur : ${c.label}`"><code>{{ model.palette[c.key] }}</code></label>
        </div>
        <button class="button secondary" type="button" @click="Object.assign(model.palette, cloneCinematicIntroSettings().palette)">Palette du site par défaut</button>
      </details>
    </fieldset>

    <!-- Audio -->
    <fieldset class="cin-set-group">
      <legend>Audio</legend>
      <div class="public-backdrop-controls">
        <label class="backdrop-toggle-option"><input v-model="model.audio.enabled" type="checkbox"><span>Activer le son</span><small>Désactivé : l’animation visuelle reste identique, sans son.</small></label>
        <div class="cin-set-range">
          <label for="cin-volume">Volume</label>
          <div class="cin-set-range-row">
            <input v-model.number="model.audio.volume" type="range" :min="limits.volume.min" :max="limits.volume.max" :step="limits.volume.step" aria-label="Volume (curseur)">
            <span class="cin-set-num"><input id="cin-volume" v-model.number="model.audio.volume" type="number" min="0" max="100" step="5" @change="normalize"><em>%</em></span>
          </div>
        </div>
      </div>
      <div class="cin-set-fields">
        <div class="field"><label for="cin-preset">Fichier audio</label>
          <select id="cin-preset" v-model="model.audio.preset">
            <option value="short">{{ cinematicIntroAudioSources.short.label }}</option>
            <option value="source">{{ cinematicIntroAudioSources.source.label }}</option>
            <option value="custom">Autre fichier de public/audio…</option>
          </select>
        </div>
        <div v-if="model.audio.preset === 'custom'" class="field"><label for="cin-custom">Chemin local du fichier</label>
          <input id="cin-custom" v-model.trim="model.audio.customSrc" type="text" placeholder="/audio/mon-son.mp3" autocomplete="off" spellcheck="false">
          <small v-if="customError" class="cin-set-error" role="alert">{{ customError }}</small>
        </div>
        <div class="field"><label>Aperçu</label>
          <div class="cin-set-inline">
            <button class="button secondary" type="button" :disabled="!resolvedSrc" @click="toggleSample"><component :is="samplePlaying ? Square : Volume2" :size="14" /> {{ samplePlaying ? 'Arrêter' : 'Écouter' }}</button>
            <span class="cin-set-status" :data-state="availability" role="status">
              {{ availability === 'ok' ? 'Fichier disponible' : availability === 'missing' ? 'Fichier introuvable sur le serveur' : availability === 'checking' ? 'Vérification…' : '' }}
            </span>
          </div>
          <small v-if="audioMessage" class="cin-set-error" role="alert">{{ audioMessage }}</small>
        </div>
      </div>
    </fieldset>

    <!-- Actions -->
    <div class="cin-set-actions">
      <button class="button" type="button" @click="startPreview"><Play :size="14" /> Prévisualiser l’introduction</button>
      <button class="button secondary" type="button" @click="restoreDefaults"><RotateCcw :size="14" /> Restaurer les valeurs par défaut</button>
      <span v-if="notice" class="muted" role="status">{{ notice }}</span>
    </div>

    <CinematicIntro v-if="previewing" preview :settings="previewSettings" @done="previewing = false" />
  </section>
</template>

<style scoped>
.cin-set { gap: 14px; }
.cin-set code { font-family: var(--mono); color: var(--cyan); }
.cin-set-group { display: grid; gap: 12px; margin: 0; padding: 12px 14px 14px; border: 1px solid rgba(74, 131, 204, 0.25); border-radius: 8px; min-width: 0; }
.cin-set-group > legend { padding: 0 6px; color: var(--cyan); font: 500 11px var(--mono); letter-spacing: 0.08em; text-transform: uppercase; }
.cin-set-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); gap: 12px 18px; align-items: start; }
.cin-set-fields .full { grid-column: 1 / -1; }
.cin-set-ranges { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 12px 22px; }
.cin-set-range { display: grid; gap: 5px; font-size: 12px; }
.cin-set-range > label { color: #b9d6e6; font: 11px var(--mono); }
.cin-set-range-row { display: flex; align-items: center; gap: 10px; }
.cin-set-range-row input[type='range'] { flex: 1; min-width: 0; accent-color: var(--cyan); }
.cin-set-num { display: inline-flex; align-items: center; gap: 4px; }
.cin-set-num input { width: 84px; min-height: 34px; padding: 4px 8px; border: 1px solid var(--line); border-radius: 6px; background: rgba(4, 12, 28, 0.8); color: var(--text); text-align: right; }
.cin-set-num em { color: #91aabd; font: normal 10px var(--mono); }
.cin-set-sync { line-height: 1.5; }
.cin-set-advanced { border-top: 1px dashed rgba(74, 131, 204, 0.25); padding-top: 10px; display: grid; gap: 12px; }
.cin-set-advanced > summary { cursor: pointer; color: #b9d6e6; font: 11px var(--mono); }
.cin-set-palette { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px 14px; }
.cin-set-palette label { display: grid; grid-template-columns: 1fr 34px; align-items: center; gap: 2px 8px; font: 11px var(--mono); color: #b9d6e6; }
.cin-set-palette input[type='color'] { width: 34px; height: 28px; padding: 0; border: 1px solid var(--line); border-radius: 5px; background: transparent; cursor: pointer; }
.cin-set-palette code { grid-column: 1 / -1; font-size: 10px; }
.cin-set-inline { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.cin-set-status { font: 11px var(--mono); color: #91aabd; }
.cin-set-status[data-state='ok'] { color: var(--green); }
.cin-set-status[data-state='missing'] { color: var(--danger); }
.cin-set-error { color: #ffb2c0; line-height: 1.5; }
.cin-set-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.cin-set .button { display: inline-flex; align-items: center; gap: 7px; }
</style>
