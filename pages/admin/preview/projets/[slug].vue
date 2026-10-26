<script setup lang="ts">
import { computed } from 'vue';
import { useFetch, useRoute, useSeoMeta } from '#imports';
import type { PortfolioData, Project } from '~/composables/usePortfolioData';
import { demoPortfolio } from '~/composables/usePortfolioData';
import ProjectTechnologyTags from '~/components/ProjectTechnologyTags.vue';

useSeoMeta({ title: 'Aperçu privé du projet — Carrel DOSSOU', robots: 'noindex, nofollow' });
const route = useRoute();
const { data: project, error } = await useFetch<Project>(`/api/admin/projects/${encodeURIComponent(String(route.params.slug))}/preview`);
const { data: portfolio } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const gallery = computed(() => [...(project.value?.gallery || [])].sort((a, b) => a.sortOrder - b.sortOrder));
</script>

<template>
  <div class="site-shell">
    <header class="topbar"><NuxtLink class="brand" to="/admin"><span class="brand-mark">←</span><span>Retour à l’administration</span></NuxtLink><span class="status-chip">Aperçu privé · non indexé</span></header>
    <main v-if="project" class="shell-container project-detail-shell">
      <div class="admin-alert" style="margin-bottom:20px">Aperçu réservé à une session propriétaire. Ce contenu n’est pas publié sur le portfolio public.</div>
      <article class="project-detail">
        <div class="eyebrow">Aperçu privé · {{ project.publicationStatus === 'draft' ? 'Brouillon' : 'Publication programmée' }}</div>
        <h1>{{ project.title }}</h1>
        <p class="project-detail-description">{{ project.description }}</p>
        <div class="tag-list project-detail-tags"><ProjectTechnologyTags :tags="project.tags" :technologies="portfolio?.technologies || []" :icon-size="17" /></div>
        <img v-if="project.imageUrl" class="window project-detail-image" :src="project.imageUrl" :alt="`Visuel principal de ${project.title}`">
        <section v-if="project.caseRole||project.caseContext||project.responsibilities?.length||project.outcomes" class="window project-detail-content">
          <div class="window-body">
            <div v-if="project.caseRole" class="case-detail-block"><h2>Rôle</h2><p>{{ project.caseRole }}</p></div>
            <div v-if="project.caseContext" class="case-detail-block"><h2>Contexte &amp; objectifs</h2><p>{{ project.caseContext }}</p></div>
            <div v-if="project.responsibilities?.length" class="case-detail-block"><h2>Responsabilités</h2><ul><li v-for="item in project.responsibilities" :key="item">{{ item }}</li></ul></div>
            <div v-if="project.outcomes" class="case-detail-block"><h2>Résultats</h2><p>{{ project.outcomes }}</p></div>
          </div>
        </section>
        <section v-if="gallery.length" class="project-gallery">
          <figure v-for="media in gallery" :key="media.url" class="window project-gallery-item"><img :src="media.url" :alt="media.alt" loading="lazy"><figcaption>{{ media.caption }}</figcaption></figure>
        </section>
      </article>
    </main>
    <p v-else-if="error" class="window admin-empty">Connecte-toi à l’administration pour prévisualiser ce projet.</p>
  </div>
</template>
