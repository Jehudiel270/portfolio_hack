<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ArrowUpRight, ExternalLink, Github, X } from 'lucide-vue-next';
import type { Project, Technology } from '~/composables/usePortfolioData';
import ProjectTechnologyTags from '~/components/ProjectTechnologyTags.vue';

defineProps<{ project: Project; technologies: Technology[]; metricsInvalid?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const closeButton = ref<HTMLButtonElement | null>(null);
let previousBodyOverflow = '';

onMounted(() => {
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  closeButton.value?.focus();
});
onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow;
});
</script>

<template>
  <Teleport to="body">
    <div class="project-preview-overlay" role="presentation" @click.self="emit('close')" @keydown.esc="emit('close')">
      <section class="window project-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="project-preview-title" tabindex="-1">
        <header class="project-preview-header">
          <div>
            <span class="eyebrow">Prévisualisation privée</span>
            <small>Les modifications non enregistrées sont visibles ici.</small>
          </div>
          <button ref="closeButton" class="icon-button" type="button" aria-label="Fermer la prévisualisation" @click="emit('close')"><X :size="18" /></button>
        </header>
        <main class="shell-container project-detail-shell project-preview-content">
          <div v-if="metricsInvalid" class="admin-alert error" role="status">Les métriques contiennent du JSON incomplet ou invalide et ne sont pas affichées dans cet aperçu.</div>
          <article class="project-detail">
            <div class="eyebrow">Étude de cas<span v-if="project.year"> · {{ project.year }}</span></div>
            <h1 id="project-preview-title">{{ project.title || 'Titre du projet' }}</h1>
            <p class="project-detail-description">{{ project.description || 'La description du projet apparaîtra ici.' }}</p>
            <div v-if="project.tags.length" class="tag-list project-detail-tags">
              <ProjectTechnologyTags :tags="project.tags" :technologies="technologies" :icon-size="17" />
            </div>
            <div v-if="project.imageUrl" class="window project-detail-image">
              <img :src="project.imageUrl" :alt="`Aperçu de ${project.title || 'du projet'}`">
            </div>
            <div v-else class="window project-detail-placeholder">
              <span class="project-detail-placeholder-icon">01</span>
              <span class="mono">Visuel du projet à ajouter</span>
            </div>
            <section class="window project-detail-content">
              <div class="window-bar"><div class="window-title"><span class="prompt">&gt;_</span><span>À propos du projet</span></div></div>
              <div class="window-body">
                <p>{{ project.description || 'La description du projet apparaîtra ici.' }}</p>
                <div v-if="project.caseRole" class="case-detail-block"><h2>Rôle</h2><p>{{ project.caseRole }}</p></div>
                <div v-if="project.caseContext" class="case-detail-block"><h2>Contexte &amp; objectifs</h2><p>{{ project.caseContext }}</p></div>
                <div v-if="project.responsibilities?.length" class="case-detail-block"><h2>Responsabilités</h2><ul><li v-for="responsibility in project.responsibilities" :key="responsibility">{{ responsibility }}</li></ul></div>
                <div v-if="project.outcomes" class="case-detail-block"><h2>Résultats</h2><p>{{ project.outcomes }}</p></div>
                <div v-if="project.metrics?.length" class="case-detail-block">
                  <h2>Indicateurs vérifiables</h2>
                  <dl class="project-metrics"><div v-for="metric in project.metrics" :key="`${metric.label}-${metric.value}`"><dt>{{ metric.label }}</dt><dd><strong>{{ metric.value }}</strong><span v-if="metric.context">{{ metric.context }}</span></dd></div></dl>
                </div>
                <div class="project-detail-actions">
                  <a v-if="project.demoUrl" class="button" :href="project.demoUrl" target="_blank" rel="noopener noreferrer">Voir le projet <ExternalLink :size="15" /></a>
                  <a v-if="project.repoUrl" class="button secondary" :href="project.repoUrl" target="_blank" rel="noopener noreferrer">Dépôt GitHub <Github :size="15" /></a>
                  <span v-if="!project.demoUrl && !project.repoUrl" class="text-link">Demander plus d’informations <ArrowUpRight :size="14" /></span>
                </div>
              </div>
            </section>
            <section v-if="project.gallery?.length" class="project-gallery">
              <h2>Galerie du projet</h2>
              <figure v-for="media in [...project.gallery].sort((a, b) => a.sortOrder - b.sortOrder)" :key="media.url" class="window project-gallery-item">
                <img :src="media.url" :alt="media.alt || `Capture de ${project.title || 'ce projet'}`" loading="lazy">
                <figcaption v-if="media.caption">{{ media.caption }}</figcaption>
              </figure>
            </section>
          </article>
        </main>
      </section>
    </div>
  </Teleport>
</template>
