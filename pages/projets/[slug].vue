<script setup lang="ts">
import { computed } from 'vue';
import { ArrowLeft, ArrowUpRight, ExternalLink, Github } from 'lucide-vue-next';
import { createError, useFetch, useRoute, useSeoMeta } from '#imports';
import { demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';
import ProjectTechnologyTags from '~/components/ProjectTechnologyTags.vue';
import { usePublicSiteUrl } from '~/composables/usePublicSiteUrl';

const route = useRoute();
const siteUrl = usePublicSiteUrl();
const defaultSocialImage = new URL('/images/social-preview.jpg', siteUrl).href;
const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const portfolio = computed(() => data.value || demoPortfolio);
const project = computed(() => portfolio.value.projects.find((item) => item.slug === route.params.slug));
const displaySettings = computed(() => portfolio.value.publicSettings?.projectDisplay ?? { defaultLayout: 'standard' as const, showType: true, showYear: true, showMetrics: true });
const richTextSettings = computed(() => portfolio.value.publicSettings?.richText);
const useRichDescription = computed(() => richTextSettings.value?.enabled === true && richTextSettings.value.fields.projectDescription);
const useRichContext = computed(() => richTextSettings.value?.enabled === true && richTextSettings.value.fields.projectContext);
const useRichOutcomes = computed(() => richTextSettings.value?.enabled === true && richTextSettings.value.fields.projectOutcomes);
const projectLayout = computed(() => project.value?.caseLayout);
const hasVisibleCaseDetails = computed(() => {
  const item = project.value;
  if (!item) return false;
  return Boolean(
    (item.caseRole && item.caseLayout?.showRole !== false)
    || (item.caseContext && item.caseLayout?.showContext !== false)
    || (item.responsibilities?.length && item.caseLayout?.showResponsibilities !== false)
    || (item.outcomes && item.caseLayout?.showOutcomes !== false)
    || (displaySettings.value.showMetrics && item.metrics?.length && item.caseLayout?.showMetrics !== false),
  );
});
const layoutAccent = computed(() => projectLayout.value?.accentColor || 'var(--cyan)');
const isEditorial = computed(() => (projectLayout.value?.layout || displaySettings.value.defaultLayout) === 'editorial');
const projectSocialImage = computed(() => {
  const imageUrl = project.value?.imageUrl;
  return imageUrl ? new URL(imageUrl, siteUrl).href : defaultSocialImage;
});

if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: 'Projet introuvable' });
}

useSeoMeta({
  title: () => `${project.value?.title || 'Projet'} — Carrel DOSSOU`,
  description: () => project.value?.description || 'Étude de cas d’un projet de Carrel DOSSOU.',
  ogTitle: () => `${project.value?.title || 'Projet'} — Carrel DOSSOU`,
  ogDescription: () => project.value?.description || 'Étude de cas d’un projet de Carrel DOSSOU.',
  ogImage: () => projectSocialImage.value,
  twitterImage: () => projectSocialImage.value,
});
</script>

<template>
  <div class="site-shell">
    <PortfolioHeader :configured="portfolio.configured" :source="portfolio.source" />
    <main class="shell-container project-detail-shell">
      <NuxtLink class="project-back text-link" to="/projets"><ArrowLeft :size="15" /> Retour aux projets</NuxtLink>
      <article v-if="project" class="project-detail" :class="{ 'project-detail--editorial': isEditorial }" :style="{ '--case-accent': layoutAccent }">
        <div class="eyebrow"><span v-if="displaySettings.showType">{{ project.projectType || 'Étude de cas' }}</span><span v-else>Étude de cas</span><span v-if="displaySettings.showYear && project.year"> · {{ project.year }}</span></div>
        <h1>{{ project.title }}</h1>
        <RichTextContent v-if="useRichDescription" as="div" class="project-detail-description rich-text-content" :content="project.description" label="Description du projet" />
        <p v-else class="project-detail-description">{{ project.description }}</p>
        <div v-if="project.categories?.length" class="tag-list project-detail-categories" aria-label="Catégories du projet">
          <span v-for="category in project.categories" :key="category" class="tag project-category-tag">{{ category }}</span>
        </div>
        <div class="tag-list project-detail-tags">
          <ProjectTechnologyTags :tags="project.tags" :technologies="portfolio.technologies" :icon-size="17" />
        </div>
        <div v-if="project.imageUrl" class="window project-detail-image">
          <img :src="project.imageUrl" :alt="`Aperçu de ${project.title}`">
        </div>
        <div v-else class="window project-detail-placeholder">
          <span class="project-detail-placeholder-icon">01</span>
          <span class="mono">Visuel du projet à venir</span>
        </div>
        <section class="window project-detail-content">
          <div class="window-bar"><div class="window-title"><span class="prompt">&gt;_</span><span>À propos du projet</span></div></div>
          <div class="window-body">
            <p>{{ project.description }}</p>
            <div v-if="project.caseRole && projectLayout?.showRole !== false" class="case-detail-block"><h2>Rôle</h2><p>{{ project.caseRole }}</p></div>
            <div v-if="project.caseContext && projectLayout?.showContext !== false" class="case-detail-block"><h2>Contexte &amp; objectifs</h2><RichTextContent v-if="useRichContext" :content="project.caseContext" label="Contexte du projet" /><p v-else>{{ project.caseContext }}</p></div>
            <div v-if="project.responsibilities?.length && projectLayout?.showResponsibilities !== false" class="case-detail-block"><h2>Responsabilités</h2><ul><li v-for="responsibility in project.responsibilities" :key="responsibility">{{ responsibility }}</li></ul></div>
            <div v-if="project.outcomes && projectLayout?.showOutcomes !== false" class="case-detail-block"><h2>Résultats</h2><RichTextContent v-if="useRichOutcomes" :content="project.outcomes" label="Résultats du projet" /><p v-else>{{ project.outcomes }}</p></div>
            <div v-if="displaySettings.showMetrics && project.metrics?.length && projectLayout?.showMetrics !== false" class="case-detail-block"><h2>Indicateurs vérifiables</h2><dl class="project-metrics"><div v-for="metric in project.metrics" :key="`${metric.label}-${metric.value}`"><dt>{{ metric.label }}</dt><dd><strong>{{ metric.value }}<template v-if="metric.unit"> {{ metric.unit }}</template></strong><span v-if="metric.context">{{ metric.context }}</span><small v-if="metric.period">Période : {{ metric.period }}</small><small v-if="metric.source">Source : {{ metric.source }}</small><a v-if="metric.evidenceUrl" :href="metric.evidenceUrl" target="_blank" rel="noopener noreferrer">Voir la preuve</a></dd></div></dl></div>
            <div v-if="!hasVisibleCaseDetails" class="case-detail-block"><p class="muted">Les détails de cette étude de cas seront complétés prochainement.</p></div>
            <div class="project-detail-actions">
              <a v-if="project.demoUrl" class="button" :href="project.demoUrl" target="_blank" rel="noopener noreferrer">Voir le projet <ExternalLink :size="15" /></a>
              <a v-if="project.repoUrl" class="button secondary" :href="project.repoUrl" target="_blank" rel="noopener noreferrer">Dépôt GitHub <Github :size="15" /></a>
              <NuxtLink v-if="!project.demoUrl && !project.repoUrl" class="text-link" to="/#contact">Demander plus d’informations <ArrowUpRight :size="14" /></NuxtLink>
            </div>
          </div>
        </section>
        <section v-if="project.gallery?.length && projectLayout?.showGallery !== false" class="project-gallery">
          <h2>Galerie du projet</h2>
          <figure v-for="media in [...project.gallery].sort((a,b)=>a.sortOrder-b.sortOrder)" :key="media.url" class="window project-gallery-item">
            <img :src="media.url" :alt="media.alt || `Capture de ${project.title}`" loading="lazy">
            <figcaption v-if="media.caption">{{ media.caption }}</figcaption>
          </figure>
        </section>
      </article>
    </main>
  </div>
</template>
