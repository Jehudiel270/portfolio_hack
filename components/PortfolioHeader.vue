<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import { Menu, X, Terminal, Sun, Moon } from 'lucide-vue-next';
import { useCookie, useFetch, useHead, useRoute } from '#imports';
import { demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';
const route = useRoute();
const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const visiblePages = computed(() => data.value?.publicSettings?.visiblePages || demoPortfolio.publicSettings!.visiblePages);
defineProps<{ configured: boolean; source: 'database'|'demo'|'unavailable' }>();
const open = ref(false);
const theme = useCookie<'dark' | 'light'>('carrelfolio-theme', {
  default: () => 'dark',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
});
useHead({ htmlAttrs: { 'data-theme': computed(() => theme.value) } });
let themeTransitionId = 0;
async function toggleTheme(event: MouseEvent) {
  const nextTheme = theme.value === 'dark' ? 'light' : 'dark';
  const root = document.documentElement;
  const bounds = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
  root.style.setProperty('--theme-origin-x', `${bounds.left + bounds.width / 2}px`);
  root.style.setProperty('--theme-origin-y', `${bounds.top + bounds.height / 2}px`);
  root.dataset.themeTransition = nextTheme;
  const transitionId = ++themeTransitionId;

  const clearTransition = () => {
    if (transitionId === themeTransitionId) {
      delete root.dataset.themeTransition;
      root.style.removeProperty('--theme-origin-x');
      root.style.removeProperty('--theme-origin-y');
    }
  };
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || typeof document.startViewTransition !== 'function') {
    theme.value = nextTheme;
    await nextTick();
    clearTransition();
    return;
  }

  const transition = document.startViewTransition(async () => {
    theme.value = nextTheme;
    await nextTick();
  });
  void transition.finished.then(clearTransition, clearTransition);
  window.setTimeout(clearTransition, 1400);
}
const links = [
  { to: '/', label: 'Accueil' },
  { to: '/parcours', label: 'Parcours' },
  { to: '/projets', label: 'Projets' },
  { to: '/competences', label: 'Compétences' },
  { to: '/ia', label: 'IA' },
  { to: '/certifications', label: 'Certifications' },
  { to: '/contact', label: 'Contact' },
];
</script>
<template>
  <header class="topbar">
    <NuxtLink class="brand" to="/"><span class="brand-mark"><Terminal :size="15" /></span><span>carrel@dev:~$ ./portfolio<span class="cursor" aria-hidden="true"></span></span></NuxtLink>
    <nav :class="['nav-links', { open }]" aria-label="Navigation principale"><NuxtLink v-for="link in links.filter(item=>item.to==='/'||visiblePages[item.to.slice(1)])" :key="link.to" :to="link.to" :class="{ active: route.path === link.to || (link.to === '/projets' && route.path.startsWith('/projets/')) }" @click="open = false">{{ link.label }}</NuxtLink></nav>
    <div :class="['status-chip', { 'preview-status': !configured }]" :title="source === 'unavailable' ? 'Les données de démonstration sont affichées car la base configurée ne répond pas ou ne contient pas encore de profil.' : undefined"><span class="status-dot"></span><span>{{ source === 'database' ? 'Données connectées' : source === 'unavailable' ? 'Base indisponible' : 'Aperçu de démonstration' }}</span></div>
    <button class="theme-toggle" type="button" :aria-label="theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'" :title="theme === 'dark' ? 'Thème clair' : 'Thème sombre'" @click="toggleTheme">
      <Transition name="theme-icon" mode="out-in">
        <Sun v-if="theme === 'dark'" key="sun" :size="17" />
        <Moon v-else key="moon" :size="17" />
      </Transition>
    </button>
    <button class="nav-mobile" :aria-label="open ? 'Fermer le menu' : 'Ouvrir le menu'" :aria-expanded="open" @click="open = !open"><X v-if="open" :size="21" /><Menu v-else :size="21" /></button>
  </header>
</template>
