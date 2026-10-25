<script setup lang="ts">
import { computed, ref } from 'vue';
import { ArrowUpRight } from 'lucide-vue-next';
import { useFetch, useSeoMeta } from '#imports';
import TechnologyIcon from '~/components/TechnologyIcon.vue';
import { demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';

useSeoMeta({ title: 'Compétences — Carrel DOSSOU', description: 'Technologies et compétences de Carrel DOSSOU.' });
const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const portfolio = computed(() => data.value || demoPortfolio);
const skills = computed(() => [...portfolio.value.skills].sort((a, b) => a.sortOrder - b.sortOrder));
const technologies = computed(() => [...portfolio.value.technologies].sort((a, b) => a.sortOrder - b.sortOrder));
const categories = computed(() => [...new Set(technologies.value.map((item) => item.category).filter((category) => category !== 'IA'))]);
const skillsByCategory = computed(() => [...new Set(skills.value.map((skill) => skill.category))]);
const search = ref('');
const selectedCategory = ref('');
const availableCategories = computed(() => [...new Set([...categories.value, ...skillsByCategory.value])].sort((a,b)=>a.localeCompare(b,'fr')));
const filteredTechnologies = computed(() => technologies.value.filter(item => item.category !== 'IA' && (!selectedCategory.value || item.category === selectedCategory.value) && (!search.value || `${item.name} ${item.category}`.toLocaleLowerCase('fr').includes(search.value.trim().toLocaleLowerCase('fr')))));
const filteredSkills = computed(() => skills.value.filter(item => (!selectedCategory.value || item.category === selectedCategory.value) && (!search.value || `${item.name} ${item.category}`.toLocaleLowerCase('fr').includes(search.value.trim().toLocaleLowerCase('fr')))));
</script>

<template>
  <div class="site-shell">
    <PortfolioHeader :configured="portfolio.configured" :source="portfolio.source" />
    <main class="shell-container route-page">
      <header class="section-head"><div><div class="eyebrow">03 / Stack</div><h1>Mes <span class="gradient-text">compétences</span></h1></div><p class="section-sub">// Technologies, outils et savoir-faire</p></header>
      <form class="project-filters skill-filters window" role="search" @submit.prevent>
        <label class="field"><span>Rechercher</span><input v-model="search" type="search" placeholder="Nom ou catégorie"></label>
        <label class="field"><span>Catégorie</span><select v-model="selectedCategory"><option value="">Toutes les catégories</option><option v-for="category in availableCategories" :key="category" :value="category">{{ category }}</option></select></label>
        <button class="button secondary project-filter-reset" type="button" :disabled="!search && !selectedCategory" @click="search='';selectedCategory=''">Effacer les filtres</button>
      </form>
      <p class="project-results-count" role="status">{{ filteredTechnologies.length + filteredSkills.length }} résultat(s)</p>
      <section v-for="category in categories.filter(category => filteredTechnologies.some(item => item.category===category))" :key="category" class="section route-skill-section">
        <h2>{{ category }}</h2>
        <div class="technology-grid">
          <article v-for="technology in filteredTechnologies.filter((item) => item.category === category)" :key="technology.name" class="window technology-card">
            <TechnologyIcon :name="technology.name" :icon="technology.icon" size="32" />
            <span>{{ technology.name }}</span>
          </article>
        </div>
      </section>
      <section v-for="category in skillsByCategory.filter(category => filteredSkills.some(item => item.category===category))" :key="category" class="section route-skill-section">
        <h2>{{ category }} · compétences</h2>
        <div class="skill-list route-skill-list">
          <div v-for="skill in filteredSkills.filter((item) => item.category === category)" :key="skill.name">
            <div class="skill-label"><span class="skill-name"><TechnologyIcon :name="skill.name" :icon="skill.icon" size="18" />{{ skill.name }}</span><span>{{ skill.level }}%</span></div>
            <div class="skill-track"><span :style="{ width: `${skill.level}%` }"></span></div>
          </div>
        </div>
      </section>
      <NuxtLink v-if="technologies.some((item) => item.category === 'IA')" class="window ai-callout" to="/ia">
        <span><span class="eyebrow">Section dédiée</span><strong>Intelligence artificielle &amp; modèles</strong></span><span class="text-link">Découvrir <ArrowUpRight :size="14" /></span>
      </NuxtLink>
    </main>
  </div>
</template>
