<script setup lang="ts">
import { ref } from 'vue';
import { FileJson2, Plus, Trash2, UploadCloud } from 'lucide-vue-next';
import type { ProjectMetric } from '~/composables/usePortfolioData';
import { metricJsonExamples, parseProjectMetricsJson } from '~/composables/adminJsonImports';

const metrics = defineModel<ProjectMetric[]>({ required: true });
const preset = ref('');
const mode = ref<'form' | 'json'>('form');
const jsonDraft = ref('');
const jsonError = ref('');
const jsonNotice = ref('');
const jsonFileInput = ref<HTMLInputElement | null>(null);
let jsonInitialized = false;
const presets: Record<string, Omit<ProjectMetric, 'value'> & { value: string }> = {
  delivery: { label: 'Délai de réalisation', value: '', context: 'Période entre le lancement et la mise en ligne', unit: 'semaines' },
  pages: { label: 'Pages réalisées', value: '', context: 'Pages publiques incluses dans le périmètre' },
  features: { label: 'Fonctionnalités livrées', value: '', context: 'Fonctionnalités terminées et vérifiées' },
  performance: { label: 'Score Lighthouse', value: '', context: 'Précise la page testée et la catégorie (Performance, Accessibilité…)', period: 'Date du test' },
  users: { label: 'Utilisateurs accompagnés', value: '', context: 'Précise la période et la source de la mesure' },
  tests: { label: 'Tests automatisés', value: '', context: 'Tests passants au moment de la livraison' },
};

function addMetric() {
  metrics.value.push({ label: '', value: '' });
}
function addPreset() {
  const example = presets[preset.value];
  if (!example) return;
  metrics.value.push({ ...example });
  preset.value = '';
}
function setMode(nextMode: 'form' | 'json') {
  if (nextMode === 'json' && !jsonInitialized) {
    jsonDraft.value = JSON.stringify(metrics.value, null, 2);
    jsonError.value = '';
    jsonNotice.value = '';
    jsonInitialized = true;
  }
  mode.value = nextMode;
}
function setExample(example: 'minimal' | 'detailed') {
  jsonDraft.value = JSON.stringify(metricJsonExamples[example], null, 2);
  jsonError.value = '';
  jsonNotice.value = 'Modèle chargé. Tu peux modifier les valeurs avant de l’appliquer.';
}
function refreshJsonFromForm() {
  jsonDraft.value = JSON.stringify(metrics.value, null, 2);
  jsonError.value = '';
  jsonNotice.value = 'Le JSON reflète maintenant le formulaire visuel.';
  jsonInitialized = true;
}
function applyJson() {
  const result = parseProjectMetricsJson(jsonDraft.value);
  if (result.error) {
    jsonError.value = result.error;
    jsonNotice.value = '';
    return;
  }
  metrics.value = result.data || [];
  jsonError.value = '';
  jsonNotice.value = `${metrics.value.length} métrique(s) validée(s) et appliquée(s) au formulaire.`;
}
async function loadJsonFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (file.size > 256_000) {
    jsonError.value = 'Le fichier JSON ne peut pas dépasser 256 Ko.';
    return;
  }
  try {
    jsonDraft.value = await file.text();
    jsonError.value = '';
    jsonNotice.value = 'Fichier chargé. Vérifie le contenu puis applique-le.';
  } catch {
    jsonError.value = 'Impossible de lire ce fichier JSON.';
  }
}
</script>

<template>
  <section class="project-metric-editor">
    <div class="metric-editor-modes" role="group" aria-label="Mode d’édition des métriques">
      <button class="button secondary" :aria-pressed="mode === 'form'" type="button" @click="setMode('form')">Formulaire</button>
      <button class="button secondary" :aria-pressed="mode === 'json'" type="button" @click="setMode('json')"><FileJson2 :size="14" /> JSON</button>
    </div>
    <div v-if="mode === 'json'" class="metric-json-editor">
      <p class="muted">Colle un tableau JSON de métriques. Les champs <code>label</code> et <code>value</code> sont obligatoires; les preuves restent facultatives. L’application ne change rien au formulaire si le JSON est invalide.</p>
      <div class="metric-json-actions">
        <button class="button secondary" type="button" @click="refreshJsonFromForm">Reprendre le formulaire</button>
        <button class="button secondary" type="button" @click="setExample('minimal')">Modèle simple</button>
        <button class="button secondary" type="button" @click="setExample('detailed')">Modèle avec preuve</button>
        <button class="button secondary" type="button" @click="jsonFileInput?.click()"><UploadCloud :size="14" /> Charger un fichier JSON</button>
        <input ref="jsonFileInput" class="metric-json-file" type="file" accept=".json,application/json" @change="loadJsonFile">
      </div>
      <label class="metric-json-label">Métriques au format JSON<textarea v-model="jsonDraft" rows="10" spellcheck="false" placeholder='[{"label":"Pages réalisées","value":"8"}]'></textarea></label>
      <p v-if="jsonError" class="metric-json-message error" role="alert">{{ jsonError }}</p>
      <p v-if="jsonNotice" class="metric-json-message" role="status">{{ jsonNotice }}</p>
      <button class="button" type="button" @click="applyJson">Valider et appliquer au formulaire</button>
    </div>
    <template v-else>
    <div class="project-metric-toolbar">
      <p class="muted">Ajoute seulement des chiffres que tu peux justifier. Les détails de preuve sont facultatifs.</p>
      <div class="project-metric-add">
        <label class="sr-only" for="metric-preset">Modèle de métrique</label>
        <select id="metric-preset" v-model="preset">
          <option value="">Choisir un modèle…</option>
          <option value="delivery">Délai de réalisation</option>
          <option value="pages">Pages réalisées</option>
          <option value="features">Fonctionnalités livrées</option>
          <option value="performance">Score Lighthouse</option>
          <option value="users">Utilisateurs accompagnés</option>
          <option value="tests">Tests automatisés</option>
        </select>
        <button class="button secondary" type="button" :disabled="!preset" @click="addPreset"><Plus :size="14" /> Ajouter le modèle</button>
        <button class="button secondary" type="button" @click="addMetric"><Plus :size="14" /> Métrique vide</button>
      </div>
    </div>

    <div v-if="!metrics.length" class="admin-empty">Aucune métrique. Tu peux laisser cette section vide ou choisir un modèle.</div>
    <fieldset v-for="(metric, index) in metrics" :key="index" class="project-metric-row">
      <legend>Métrique {{ index + 1 }}</legend>
      <button class="icon-button danger project-metric-remove" type="button" :aria-label="`Supprimer la métrique ${index + 1}`" @click="metrics.splice(index, 1)"><Trash2 :size="14" /></button>
      <label>Indicateur<input v-model.trim="metric.label" maxlength="80" placeholder="Ex. Score Lighthouse"></label>
      <label>Valeur mesurée<input v-model.trim="metric.value" maxlength="100" placeholder="Ex. 96"></label>
      <label>Unité (facultative)<input v-model.trim="metric.unit" maxlength="40" placeholder="Ex. /100, semaines"></label>
      <label>Période (facultative)<input v-model.trim="metric.period" maxlength="80" placeholder="Ex. test du 15/03/2026"></label>
      <label class="full">Contexte / méthode<textarea v-model.trim="metric.context" maxlength="300" rows="2" placeholder="Page testée, périmètre, méthode de calcul…"></textarea></label>
      <label class="full">Source (facultative)<input v-model.trim="metric.source" maxlength="300" placeholder="Ex. Rapport PageSpeed Insights"></label>
      <label class="full">Lien de preuve (facultatif)<input v-model.trim="metric.evidenceUrl" type="url" maxlength="1200" placeholder="https://…"></label>
    </fieldset>
    </template>
  </section>
</template>

<style scoped>
.project-metric-editor { display: grid; gap: 12px; }
.metric-editor-modes, .metric-json-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.metric-editor-modes [aria-pressed='true'] { border-color: var(--cyan); color: var(--cyan); }
.metric-json-editor { display: grid; min-width: 0; gap: 10px; padding: 12px; border: 1px solid rgba(74, 131, 204, .25); border-radius: 8px; }
.metric-json-editor > p { margin: 0; font-size: 12px; }
.metric-json-label { display: grid; min-width: 0; gap: 6px; color: var(--muted); font-size: 12px; }
.metric-json-label textarea { width: 100%; min-width: 0; padding: 10px; border: 1px solid var(--line); border-radius: 6px; background: rgba(4, 12, 28, .75); color: var(--text); font: 12px/1.5 var(--mono); resize: vertical; }
.metric-json-message.error { color: #ff9cac; }
.metric-json-file { display: none; }
.project-metric-toolbar { display: grid; gap: 10px; }
.project-metric-toolbar p { margin: 0; }
.project-metric-add { display: flex; flex-wrap: wrap; gap: 8px; }
.project-metric-add select { flex: 1 1 180px; min-width: 0; }
.project-metric-row { position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; min-width: 0; margin: 0; padding: 16px 12px 12px; border: 1px solid rgba(74, 131, 204, .25); border-radius: 8px; }
.project-metric-row legend { padding: 0 5px; color: var(--cyan); font: 11px var(--mono); }
.project-metric-row label { display: grid; gap: 5px; min-width: 0; color: var(--muted); font-size: 12px; }
.project-metric-row input, .project-metric-row textarea { width: 100%; min-width: 0; }
.project-metric-row .full { grid-column: 1 / -1; }
.project-metric-remove { position: absolute; top: 3px; right: 6px; }
@media (max-width: 520px) { .project-metric-row { grid-template-columns: minmax(0, 1fr); } .project-metric-row .full { grid-column: auto; } }
</style>
