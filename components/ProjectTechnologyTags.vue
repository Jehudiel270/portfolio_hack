<script setup lang="ts">
import { computed } from 'vue';
import type { Technology } from '~/composables/usePortfolioData';
import TechnologyIcon from '~/components/TechnologyIcon.vue';

const props = withDefaults(defineProps<{
  tags: string[];
  technologies: Technology[];
  limit?: number;
  iconSize?: number;
}>(), {
  iconSize: 16,
});

const displayedTags = computed(() => props.limit === undefined ? props.tags : props.tags.slice(0, props.limit));
function iconForTag(tag: string) {
  return props.technologies.find((technology) =>
    technology.name.trim().toLocaleLowerCase('fr') === tag.trim().toLocaleLowerCase('fr'),
  )?.icon;
}
</script>

<template>
  <span
    v-for="tag in displayedTags"
    :key="tag"
    class="tag technology-tag"
  >
    <TechnologyIcon :name="tag" :icon="iconForTag(tag)" :size="iconSize" eager />
    <span>{{ tag }}</span>
  </span>
</template>
