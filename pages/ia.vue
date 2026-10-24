<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Sparkles } from 'lucide-vue-next';
import { useFetch, useRoute, useRouter, useSeoMeta } from '#imports';
import TechnologyIcon from '~/components/TechnologyIcon.vue';
import { demoPortfolio, type AiType, type PortfolioData } from '~/composables/usePortfolioData';
import { aiAccessModeLabels, aiTypeLabels } from '~/composables/aiCatalog';
import { filterAiTools } from '~/composables/aiFilters';

useSeoMeta({
  title: 'Intelligence artificielle — Carrel DOSSO',
  description: 'Outils, modèles et technologies d’intelligence artificielle présentés dans le portfolio de Carrel DOSSO.',
});
const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const portfolio = computed(() => data.value || demoPortfolio);
const route = useRoute();
const router = useRouter();
const aiTypes: AiType[] = ['provider', 'model', 'assistant', 'tool'];
const search = ref(typeof route.query.q === 'string' ? route.query.q : '');
const selectedType = ref(typeof route.query.type === 'string' ? route.query.type : '');
const aiTools = computed(() => portfolio.value.technologies
  .filter((technology) => technology.category === 'IA')
  .sort((a, b) => a.sortOrder - b.sortOrder));
const filteredAiTools = computed(() => filterAiTools(aiTools.value, {
  query: search.value,
  type: selectedType.value,
}));
const aiGroups = computed(() => aiTypes
  .map((type) => ({
    type,
    label: aiTypeLabels[type],
    items: filteredAiTools.value.filter((tool) => (tool.aiType || 'tool') === type),
  }))
  .filter((group) => group.items.length));
const availableTypes = computed(() => aiTypes.filter((type) => aiTools.value.some((tool) => (tool.aiType || 'tool') === type)));
const providers = computed(() => new Map(aiTools.value
  .filter((tool) => tool.aiType === 'provider' && tool.id)
  .map((tool) => [tool.id!, tool.name])));

watch([search, selectedType], () => {
  const query = { ...route.query };
  if (search.value.trim()) query.q = search.value.trim();
  else delete query.q;
  if (selectedType.value) query.type = selectedType.value;
  else delete query.type;
  void router.replace({ query });
});

watch(() => route.query, (query) => {
  search.value = typeof query.q === 'string' ? query.q : '';
  selectedType.value = typeof query.type === 'string' ? query.type : '';
});

function clearFilters() {
  search.value = '';
  selectedType.value = '';
}
</script>

<template>
  <div class="site-shell">
    <PortfolioHeader :configured="portfolio.configured" :source="portfolio.source" />
    <main class="shell-container route-page">
      <header class="section-head">
        <div><div class="eyebrow">04 / Intelligence artificielle</div><h1>IA, modèles <span class="gradient-text">&amp; assistants</span></h1></div>
        <p class="section-sub">// Outils, modèles et assistants</p>
      </header>
      <p class="ai-intro">Découvrez une sélection d’outils d’intelligence artificielle, de modèles et d’assistants.</p>
      <form v-if="aiTools.length" class="project-filters window" role="search" @submit.prevent>
        <label class="field">
          <span>Rechercher un outil ou un usage</span>
          <input v-model="search" type="search" placeholder="Nom, description ou cas d’usage">
        </label>
        <label class="field">
          <span>Famille</span>
          <select v-model="selectedType">
            <option value="">Toutes les familles</option>
            <option v-for="type in availableTypes" :key="type" :value="type">{{ aiTypeLabels[type] }}</option>
          </select>
        </label>
        <button class="button secondary project-filter-reset" type="button" :disabled="!search && !selectedType" @click="clearFilters">Effacer les filtres</button>
      </form>
      <p v-if="aiTools.length" class="project-results-count" role="status">{{ filteredAiTools.length }} outil(s) affiché(s) sur {{ aiTools.length }}</p>
      <template v-if="filteredAiTools.length">
        <section v-for="group in aiGroups" :key="group.type" class="ai-type-section">
          <h2 class="ai-type-heading">{{ group.label }}</h2>
          <div class="ai-tool-grid">
            <article v-for="tool in group.items" :key="tool.id || tool.name" class="window ai-tool-card">
              <TechnologyIcon :name="tool.name" :icon="tool.icon" size="38" />
              <h3>{{ tool.name }}</h3>
              <p v-if="tool.description" class="ai-tool-description">{{ tool.description }}</p>
              <div class="ai-tool-meta">
                <span v-if="tool.aiProviderId && providers.has(tool.aiProviderId)">Par {{ providers.get(tool.aiProviderId) }}</span>
                <span v-if="tool.aiAccessMode">Accès : {{ aiAccessModeLabels[tool.aiAccessMode] }}</span>
                <span v-if="tool.aiUseCases?.length">Usages : {{ tool.aiUseCases.join(', ') }}</span>
                <span v-if="tool.aiVerifiedAt">Vérifié le {{ tool.aiVerifiedAt }}</span>
                <a v-if="tool.officialUrl" :href="tool.officialUrl" target="_blank" rel="noopener noreferrer">Site officiel ↗</a>
              </div>
            </article>
          </div>
        </section>
      </template>
      <section v-else-if="aiTools.length" class="window admin-empty">
        Aucun outil IA ne correspond à ces filtres.
        <button class="text-link" type="button" @click="clearFilters">Effacer les filtres</button>
      </section>
      <section v-else class="window ai-empty">
        <Sparkles :size="30" />
        <h2>Aucun outil IA publié pour le moment</h2>
        <p>Les outils, modèles et assistants d’intelligence artificielle seront présentés ici prochainement.</p>
      </section>
    </main>
  </div>
</template>
