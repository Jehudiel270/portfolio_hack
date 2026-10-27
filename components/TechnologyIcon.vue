<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { createIconifyUrl } from '~/composables/iconify';

const props = withDefaults(defineProps<{ name: string; icon?: string | null; size?: number | string; eager?: boolean }>(), { eager: false });
const failed = ref(false);
const aliases: Record<string, string> = {
  'angular': 'angular-icon',
  'astro': 'astro-icon',
  'anthropic': 'anthropic-icon',
  'bootstrap': 'bootstrap',
  'bun': 'bun',
  'c': 'c',
  'c#': 'c-sharp',
  'c++': 'c-plusplus',
  'claude': 'claude-icon',
  'claude code': 'claude-code',
  'cloudinary': 'cloudinary',
  'cursor': 'cursor-icon',
  'dart': 'dart',
  'deepseek': 'deepseek-icon',
  'css': 'css-3',
  'css3': 'css-3',
  'django': 'django-icon',
  'docker': 'docker-icon',
  'express': 'express',
  'figma': 'figma',
  'firebase': 'firebase',
  'flutter': 'flutter',
  'git': 'git-icon',
  'github': 'github-icon',
  'github copilot': 'github-copilot',
  'go': 'go',
  'google gemini': 'google-gemini-icon',
  'hugging face': 'hugging-face-icon',
  'html': 'html-5',
  'html5': 'html-5',
  'java': 'java',
  'javascript': 'javascript',
  'js': 'javascript',
  'kotlin': 'kotlin',
  'langchain': 'langchain-icon',
  'laravel': 'laravel',
  'mistral ai': 'mistral-ai-icon',
  'mongodb': 'mongodb-icon',
  'next.js': 'nextjs-icon',
  'node': 'nodejs-icon',
  'node.js': 'nodejs-icon',
  'nuxt': 'nuxt-icon',
  'nuxt.js': 'nuxt-icon',
  'ollama': 'ollama',
  'openai': 'openai-icon',
  'perplexity': 'perplexity-icon',
  'php': 'php',
  'pytorch': 'pytorch-icon',
  'postgres': 'postgresql',
  'postgresql': 'postgresql',
  'python': 'python',
  'react': 'react',
  'redis': 'redis',
  'ruby': 'ruby',
  'rust': 'rust',
  'sass': 'sass',
  'spring': 'spring-icon',
  'sqlite': 'sqlite',
  'supabase': 'supabase-icon',
  'svelte': 'svelte-icon',
  'tailwind': 'tailwindcss-icon',
  'tailwind css': 'tailwindcss-icon',
  'tensorflow': 'tensorflow',
  'typescript': 'typescript-icon',
  'vite': 'vitejs',
  'vue': 'vue',
  'vue.js': 'vue',
  'webpack': 'webpack',
};
const iconSource = computed(() => {
  const value = props.icon?.trim() || '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(?:logos|devicon|simple-icons):[a-z0-9-]+$/i.test(value)) {
    const [prefix, slug] = value.split(':');
    return createIconifyUrl(prefix, slug);
  }
  if (value) return '';
  const slug = aliases[(props.name || '').trim().toLowerCase()];
  return slug ? createIconifyUrl('logos', slug) : '';
});
const fallback = computed(() => props.icon && !props.icon.startsWith('logos:') && !/^https?:\/\//i.test(props.icon)
  ? props.icon.replace(/^text:/i, '').slice(0, 3).toUpperCase()
  : (props.name || '?').trim().slice(0, 2).toUpperCase());
watch(iconSource, () => { failed.value = false; });
</script>

<template>
  <img v-if="iconSource && !failed" class="technology-icon" :src="iconSource" :alt="`${name} logo`" :width="size || 22" :height="size || 22" :loading="eager?'eager':'lazy'" referrerpolicy="no-referrer" @error="failed = true">
  <span v-else class="technology-icon-fallback" :style="{ width: `${size || 22}px`, height: `${size || 22}px` }" aria-hidden="true">{{ fallback }}</span>
</template>
