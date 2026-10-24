<script setup lang="ts">
import { computed, ref } from 'vue';
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
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}
const links = [
  { to: '/', label: 'Accueil' },
  { to: '/parcours', label: 'Parcours' },
  { to: '/projets', label: 'Projets' },
  { to: '/competences', label: 'Compétences' },
  { to: '/ia', label: 'IA' },
  { to: '/realisations', label: 'Réalisations' },
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
      <Sun v-if="theme === 'dark'" :size="17" />
      <Moon v-else :size="17" />
    </button>
    <button class="nav-mobile" :aria-label="open ? 'Fermer le menu' : 'Ouvrir le menu'" :aria-expanded="open" @click="open = !open"><X v-if="open" :size="21" /><Menu v-else :size="21" /></button>
  </header>
</template>
