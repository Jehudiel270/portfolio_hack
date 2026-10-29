<script setup lang="ts">
import { ArrowUpRight, Code2, ExternalLink, Github } from 'lucide-vue-next';
import ProjectTechnologyTags from '~/components/ProjectTechnologyTags.vue';
import type { Technology } from '~/composables/usePortfolioData';
export interface ProjectItem { id?: number; title: string; slug?: string; description: string; tags: string[]; categories?: string[]; demoUrl?: string | null; repoUrl?: string | null; imageUrl?: string | null; year?: string | null; featured?: boolean; }
defineProps<{ project: ProjectItem; technologies?: Technology[] }>();
</script>
<template>
  <article class="window project-feature">
    <div class="window-bar"><div class="window-title"><span class="prompt">&gt;_</span><span>{{ project.slug || 'projet' }}</span></div><div class="window-controls"><i></i><i></i><i></i></div></div>
    <NuxtLink v-if="project.slug" class="project-visual project-visual-link" :to="`/projets/${project.slug}`" :aria-label="`Découvrir le projet ${project.title}`"><img v-if="project.imageUrl" :src="project.imageUrl" :alt="`Aperçu de ${project.title}`" loading="lazy"><Code2 v-else /></NuxtLink>
    <div v-else class="project-visual"><img v-if="project.imageUrl" :src="project.imageUrl" :alt="`Aperçu de ${project.title}`" loading="lazy"><Code2 v-else /></div>
    <div class="project-feature-body">
      <h3><NuxtLink v-if="project.slug" :to="`/projets/${project.slug}`">{{ project.title }}</NuxtLink><template v-else>{{ project.title }}</template></h3>
      <p>{{ project.description }}</p>
      <div v-if="project.categories?.length" class="tag-list project-category-tags" aria-label="Catégories du projet"><span v-for="category in project.categories.slice(0, 3)" :key="category" class="tag project-category-tag">{{ category }}</span></div>
      <div class="tag-list"><ProjectTechnologyTags :tags="project.tags" :technologies="technologies || []" :limit="3" /></div>
      <div class="project-bottom">
        <NuxtLink v-if="project.slug" class="text-link" :to="`/projets/${project.slug}`">Étude de cas <ArrowUpRight :size="14" /></NuxtLink>
        <span v-else class="muted mono" style="font-size:10px">{{ project.year }}</span>
        <span class="project-external-links">
          <a v-if="project.demoUrl" class="text-link" :href="project.demoUrl" target="_blank" rel="noopener noreferrer" :aria-label="`Ouvrir la démo de ${project.title}`"><ExternalLink :size="14" /></a>
          <a v-if="project.repoUrl" class="text-link" :href="project.repoUrl" target="_blank" rel="noopener noreferrer" :aria-label="`Ouvrir le dépôt de ${project.title}`"><Github :size="14" /></a>
        </span>
      </div>
    </div>
  </article>
</template>
