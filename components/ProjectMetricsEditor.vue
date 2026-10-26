<script setup lang="ts">
import { ref } from 'vue';
import { Plus, Trash2 } from 'lucide-vue-next';
import type { ProjectMetric } from '~/composables/usePortfolioData';

const metrics = defineModel<ProjectMetric[]>({ required: true });
const preset = ref('');
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
</script>

<template>
  <section class="project-metric-editor">
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
  </section>
</template>

<style scoped>
.project-metric-editor { display: grid; gap: 12px; }
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
