<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFetch, useRoute, useRouter, useSeoMeta } from '#imports';
import ProjectCard from '~/components/ProjectCard.vue';
import { filterProjects } from '~/composables/projectFilters';
import { demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';

useSeoMeta({ title: 'Projets — Carrel DOSSOU', description: 'Projets et études de cas de Carrel DOSSOU.' });
const route = useRoute();
const router = useRouter();
const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const portfolio = computed(() => data.value || demoPortfolio);
const allProjects = computed(() => [...portfolio.value.projects].sort((a, b) => a.sortOrder - b.sortOrder));
const search = ref(typeof route.query.q === 'string' ? route.query.q : '');
const selectedTechnology = ref(typeof route.query.stack === 'string' ? route.query.stack : '');
const selectedYear = ref(typeof route.query.year === 'string' ? route.query.year : '');
const selectedType = ref(typeof route.query.type === 'string' ? route.query.type : '');
const technologies = computed(() => [...new Set(allProjects.value.flatMap((project) => project.tags))].sort((a, b) => a.localeCompare(b, 'fr')));
const years = computed(() => [...new Set(allProjects.value.map((project) => project.year).filter((year): year is string => !!year))].sort((a, b) => b.localeCompare(a)));
const projectTypes = computed(() => [...new Set(allProjects.value.map((project) => project.projectType || 'Web'))].sort((a, b) => a.localeCompare(b, 'fr')));
const projects = computed(() => {
  return filterProjects(allProjects.value, { query: search.value, technology: selectedTechnology.value, year: selectedYear.value, type: selectedType.value });
});

watch([search, selectedTechnology, selectedYear, selectedType], () => {
  const query = { ...route.query };
  if (search.value.trim()) query.q = search.value.trim();
  else delete query.q;
  if (selectedTechnology.value) query.stack = selectedTechnology.value;
  else delete query.stack;
  if (selectedYear.value) query.year = selectedYear.value;
  else delete query.year;
  if (selectedType.value) query.type = selectedType.value;
  else delete query.type;
  void router.replace({ query });
});

watch(() => route.query, (query) => {
  search.value = typeof query.q === 'string' ? query.q : '';
  selectedTechnology.value = typeof query.stack === 'string' ? query.stack : '';
  selectedYear.value = typeof query.year === 'string' ? query.year : '';
  selectedType.value = typeof query.type === 'string' ? query.type : '';
});

function clearFilters() {
  search.value = '';
  selectedTechnology.value = '';
  selectedYear.value = '';
  selectedType.value = '';
}
</script>

<template>
  <div class="site-shell">
    <PortfolioHeader :configured="portfolio.configured" :source="portfolio.source" />
    <main class="shell-container route-page">
      <header class="section-head"><div><div class="eyebrow">02 / Sélection</div><h1>Mes <span class="gradient-text">projets</span></h1></div><p class="section-sub">// Des idées devenues interfaces</p></header>
      <form v-if="allProjects.length" class="project-filters window" role="search" @submit.prevent>
        <label class="field">
          <span>Rechercher un projet</span>
          <input v-model="search" type="search" placeholder="Nom, description ou technologie">
        </label>
        <label class="field">
          <span>Technologie</span>
          <select v-model="selectedTechnology">
            <option value="">Toutes les technologies</option>
            <option v-for="technology in technologies" :key="technology" :value="technology">{{ technology }}</option>
          </select>
        </label>
        <label class="field">
          <span>Année</span>
          <select v-model="selectedYear">
            <option value="">Toutes les années</option>
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
        </label>
        <label class="field">
          <span>Type de projet</span>
          <select v-model="selectedType">
            <option value="">Tous les types</option>
            <option v-for="type in projectTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <button class="button secondary project-filter-reset" type="button" :disabled="!search && !selectedTechnology && !selectedYear && !selectedType" @click="clearFilters">Effacer les filtres</button>
      </form>
      <p v-if="allProjects.length" class="project-results-count" role="status">{{ projects.length }} projet{{ projects.length > 1 ? 's' : '' }} affiché{{ projects.length > 1 ? 's' : '' }} sur {{ allProjects.length }}</p>
      <div v-if="projects.length" class="project-grid"><ProjectCard v-for="project in projects" :key="project.slug" :project="project" /></div>
      <p v-else-if="allProjects.length" class="window admin-empty">Aucun projet ne correspond à ces filtres. <button class="text-link" type="button" @click="clearFilters">Effacer les filtres</button></p>
      <p v-else class="window admin-empty">Aucun projet n’est disponible pour le moment.</p>
    </main>
  </div>
</template>
