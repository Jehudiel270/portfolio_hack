<script setup lang="ts">
import { computed } from 'vue';
import { Sparkles } from 'lucide-vue-next';
import { useFetch, useSeoMeta } from '#imports';
import { demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';

useSeoMeta({ title: 'Réalisations — Carrel DOSSO', description: 'Réalisations et accomplissements de Carrel DOSSO.' });
const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const portfolio = computed(() => data.value || demoPortfolio);
const achievements = computed(() => [...portfolio.value.achievements].sort((a, b) => a.sortOrder - b.sortOrder));
</script>

<template>
  <div class="site-shell">
    <PortfolioHeader :configured="portfolio.configured" :source="portfolio.source" />
    <main class="shell-container route-page">
      <header class="section-head"><div><div class="eyebrow">04 / Repères</div><h1>Mes <span class="gradient-text">réalisations</span></h1></div><p class="section-sub">// Étapes et accomplissements</p></header>
      <div class="achievement-grid">
        <article v-for="item in achievements" :key="item.title" class="window achievement-card">
          <div class="achievement-icon"><Sparkles :size="19" /></div>
          <div><span class="date">{{ item.date || 'Réalisé' }}</span><h2>{{ item.title }}</h2><p>{{ item.description }}</p></div>
        </article>
        <p v-if="!achievements.length" class="window admin-empty">Aucune réalisation n’est présentée pour le moment.</p>
      </div>
    </main>
  </div>
</template>
