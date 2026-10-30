<script setup lang="ts">
import { computed } from 'vue';
import { Briefcase, ExternalLink, GraduationCap } from 'lucide-vue-next';
import { useFetch, useSeoMeta } from '#imports';
import { demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';

useSeoMeta({ title: 'Parcours — Carrel DOSSOU', description: 'Le parcours et les expériences de Carrel DOSSOU.' });
const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const portfolio = computed(() => data.value || demoPortfolio);
const journey = computed(() => [...portfolio.value.journey].sort((a, b) => a.sortOrder - b.sortOrder));
const educations = computed(() => [...portfolio.value.educations].sort((a, b) => a.sortOrder - b.sortOrder));

function formatTimelineDate(value: string | null | undefined) {
  if (!value) return '';
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!dateOnly) return value;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) return value;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'UTC' })
    .format(timestamp);
}
</script>

<template>
  <div class="site-shell">
    <PortfolioHeader :configured="portfolio.configured" :source="portfolio.source" />
    <main class="shell-container route-page">
      <header class="section-head"><div><div class="eyebrow">01 / Parcours</div><h1>Mon <span class="gradient-text">parcours</span></h1></div><p class="section-sub">// Expériences professionnelles et formations</p></header>
      <section v-if="educations.length" class="journey-group">
        <h2>Formations &amp; diplômes</h2>
        <div class="timeline">
          <article v-for="item in educations" :key="item.id || `${item.institution}-${item.startDate}`" class="window timeline-card">
            <GraduationCap class="timeline-mark" :size="19" />
            <img v-if="item.imageUrl" class="journey-image" :src="item.imageUrl" :alt="`Visuel associé à ${item.title} à ${item.institution}`" loading="lazy">
            <span class="date">{{ formatTimelineDate(item.startDate) }} — {{ formatTimelineDate(item.endDate) || (item.status === 'in_progress' ? 'En cours' : 'Terminée') }}</span>
            <h2>{{ item.title }}</h2>
            <p class="mono journey-organization">{{ item.institution }}<span v-if="item.degree"> · {{ item.degree }}</span><span v-if="item.location"> · {{ item.location }}</span></p>
            <p v-if="item.description">{{ item.description }}</p>
            <span class="education-status">{{ item.status === 'completed' ? 'Diplôme obtenu' : 'Formation en cours' }}</span>
            <a v-if="item.documentUrl" class="button secondary journey-evidence-link" :href="item.documentUrl" target="_blank" rel="noopener noreferrer">Voir le justificatif PDF <ExternalLink :size="14" /></a>
          </article>
        </div>
      </section>
      <section v-if="journey.length" class="journey-group">
        <h2>Expériences professionnelles</h2>
        <div class="timeline">
          <article v-for="item in journey" :key="`${item.organization}-${item.startDate}`" class="window timeline-card">
            <Briefcase class="timeline-mark" :size="19" />
            <img v-if="item.imageUrl" class="journey-image" :src="item.imageUrl" :alt="`Visuel associé à ${item.role} chez ${item.organization}`" loading="lazy">
            <span class="date">{{ formatTimelineDate(item.startDate) }} — {{ formatTimelineDate(item.endDate) || 'Aujourd’hui' }}</span>
            <h2>{{ item.role }}</h2>
            <p class="mono journey-organization">{{ item.organization }}<span v-if="item.location"> · {{ item.location }}</span></p>
            <p>{{ item.description }}</p>
            <a v-if="item.documentUrl" class="button secondary journey-evidence-link" :href="item.documentUrl" target="_blank" rel="noopener noreferrer">Voir le justificatif PDF <ExternalLink :size="14" /></a>
          </article>
        </div>
      </section>
      <p v-if="!journey.length&&!educations.length" class="window admin-empty">Les informations de parcours seront présentées ici prochainement.</p>
      <NuxtLink class="button secondary route-home-link" to="/">Retour à l’accueil</NuxtLink>
    </main>
  </div>
</template>
