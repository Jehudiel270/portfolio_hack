<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUpRight } from 'lucide-vue-next';
import { useFetch, useSeoMeta } from '#imports';
import { demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';

useSeoMeta({
  title: 'Témoignages — Carrel DOSSOU',
  description: 'Retours et témoignages publiés avec autorisation sur le travail de Carrel DOSSOU.',
});

const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const portfolio = computed(() => data.value || demoPortfolio);
const testimonials = computed(() => [...portfolio.value.testimonials].sort((a, b) => a.sortOrder - b.sortOrder));
</script>

<template>
  <div class="site-shell">
    <PortfolioHeader :configured="portfolio.configured" :source="portfolio.source" />
    <main class="shell-container route-page">
      <header class="section-head">
        <div><div class="eyebrow">06 / Retours</div><h1>Ils en parlent <span class="gradient-text">mieux que moi</span></h1></div>
        <p class="section-sub">// Citations publiées avec autorisation</p>
      </header>
      <div v-if="testimonials.length" class="testimonial-grid">
        <figure v-for="item in testimonials" :key="item.id || item.author" class="window testimonial-card">
          <blockquote>{{ item.quote }}</blockquote>
          <figcaption>
            <strong>{{ item.author }}</strong>
            <span>{{ [item.role, item.organization].filter(Boolean).join(' · ') }}</span>
            <NuxtLink v-if="item.projectSlug && item.projectTitle" class="text-link" :to="`/projets/${item.projectSlug}`">Projet associé : {{ item.projectTitle }} <ArrowUpRight :size="13" /></NuxtLink>
            <time v-if="item.receivedAt" class="date" :datetime="item.receivedAt">{{ item.receivedAt }}</time>
            <a v-if="item.sourceUrl" class="text-link" :href="item.sourceUrl" target="_blank" rel="noopener noreferrer">Voir la source publique <ArrowUpRight :size="13" /></a>
          </figcaption>
        </figure>
      </div>
      <section v-else class="window admin-empty">
        <h2>Aucun témoignage publié pour le moment</h2>
        <p>Les retours publiés avec autorisation seront présentés ici prochainement.</p>
      </section>
      <NuxtLink class="button secondary route-home-link" to="/">Retour à l’accueil</NuxtLink>
    </main>
  </div>
</template>
