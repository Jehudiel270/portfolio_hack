<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { useFetch, useHead, useRoute } from '#imports';
import AdminMazeBackdrop from '~/components/AdminMazeBackdrop.vue';
import { defaultPublicBackgroundSettings, demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
const { data: portfolioData, error: portfolioError, refresh: refreshPortfolio } = await useFetch<PortfolioData>('/api/portfolio', {
  default: () => demoPortfolio,
  immediate: !isAdminRoute.value,
});
const publicBackground = computed(() => ({
  ...defaultPublicBackgroundSettings,
  ...portfolioData.value.publicSettings?.background,
}));
const publicBackgroundStyle = computed(() => ({
  '--public-ambient-intensity': String(publicBackground.value.ambientIntensity / 100),
  '--public-maze-intensity': String(publicBackground.value.mazeIntensity / 100),
}));
useHead(computed(() => ({
  htmlAttrs: {
    'data-public-background-image': publicBackground.value.showImage ? 'on' : 'off',
  },
})));
watch(() => route.path, (path, previousPath) => {
  if (previousPath.startsWith('/admin') && !path.startsWith('/admin')) void refreshPortfolio();
});
watch(portfolioError, (error) => {
  if (error) console.warn('[Public background] Could not load saved background settings.', error);
});
let revealObserver: IntersectionObserver | undefined;
let progressFrame = 0;

function updateScrollProgress() {
  if (route.path.startsWith('/admin')) return;
  if (progressFrame) return;
  progressFrame = window.requestAnimationFrame(() => {
    progressFrame = 0;
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    document.documentElement.style.setProperty('--scroll-progress', String(Math.min(1, Math.max(0, progress))));
  });
}

function updateCardSpotlight(event: PointerEvent) {
  if (route.path.startsWith('/admin')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !(event.target instanceof Element)) return;
  const card = event.target.closest<HTMLElement>(
    '.site-shell .project-card, .site-shell .project-feature, .site-shell .content-panel, .site-shell .timeline-card, .site-shell .technology-card, .site-shell .ai-tool-card, .site-shell .achievement-card, .site-shell .certification-card, .site-shell .project-gallery-item',
  );
  if (!card) return;

  const bounds = card.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  card.style.setProperty('--pointer-x', `${(x * 100).toFixed(1)}%`);
  card.style.setProperty('--pointer-y', `${(y * 100).toFixed(1)}%`);
  card.style.setProperty('--tilt-x', `${((x - 0.5) * 8).toFixed(2)}deg`);
  card.style.setProperty('--tilt-y', `${((0.5 - y) * 6).toFixed(2)}deg`);
}

function revealVisibleContent() {
  for (const target of document.querySelectorAll<HTMLElement>('.scroll-reveal.is-pending')) {
    const bounds = target.getBoundingClientRect();
    if (bounds.top >= window.innerHeight || bounds.bottom <= 0) continue;
    target.classList.remove('is-pending');
    target.classList.add('is-visible');
    revealObserver?.unobserve(target);
  }
}

async function observePageContent() {
  await nextTick();
  revealObserver?.disconnect();
  window.removeEventListener('scroll', revealVisibleContent);
  if (route.path.startsWith('/admin')) return;

  const targets = document.querySelectorAll<HTMLElement>(
    '.site-shell main > *, .site-shell main .project-card, .site-shell main .project-feature, .site-shell main .content-panel, .site-shell main .timeline-card, .site-shell main .technology-card, .site-shell main .ai-tool-card, .site-shell main .achievement-card, .site-shell main .certification-card, .site-shell main .project-detail-content, .site-shell main .project-gallery-item',
  );

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    targets.forEach((target) => target.classList.remove('scroll-reveal', 'is-visible'));
    return;
  }

  revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('is-pending');
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

  const siblingIndexes = new Map<Element, number>();
  targets.forEach((target) => {
    target.classList.remove('is-pending', 'is-visible');
    target.classList.add('scroll-reveal');
    const parent = target.parentElement;
    if (parent) {
      const siblingIndex = siblingIndexes.get(parent) ?? 0;
      target.style.setProperty('--reveal-delay', `${Math.min(siblingIndex, 5) * 90}ms`);
      siblingIndexes.set(parent, siblingIndex + 1);
    }
    if (target.getBoundingClientRect().top >= window.innerHeight) {
      target.classList.add('is-pending');
    } else {
      target.classList.add('is-visible');
    }
    revealObserver?.observe(target);
  });
  window.addEventListener('scroll', revealVisibleContent, { passive: true });
  revealVisibleContent();
}

onMounted(() => {
  void observePageContent();
  updateScrollProgress();
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress, { passive: true });
  document.addEventListener('pointermove', updateCardSpotlight, { passive: true });
});

async function trackPageView() {
  if (route.path.startsWith('/admin')) return;
  try {
    await $fetch('/api/metrics/page', { method: 'POST', body: { path: route.path } });
  } catch (error) {
    console.warn('[Analytics] Could not record anonymous page view.', error);
  }
}

onMounted(() => { void trackPageView(); });

watch(() => route.path, () => {
  void observePageContent();
  void trackPageView();
  updateScrollProgress();
});

onBeforeUnmount(() => {
  revealObserver?.disconnect();
  window.removeEventListener('scroll', revealVisibleContent);
  window.removeEventListener('scroll', updateScrollProgress);
  window.removeEventListener('resize', updateScrollProgress);
  document.removeEventListener('pointermove', updateCardSpotlight);
  if (progressFrame) window.cancelAnimationFrame(progressFrame);
});
</script>

<template>
  <div v-if="!isAdminRoute && publicBackground.showAmbient" class="public-ambient-backdrop" :style="publicBackgroundStyle" aria-hidden="true"></div>
  <AdminMazeBackdrop
    v-if="!isAdminRoute && publicBackground.showMaze"
    class="public-maze-canvas"
    :speed="publicBackground.speed"
    :style="publicBackgroundStyle"
  />
  <div v-if="!isAdminRoute" class="site-scroll-progress" aria-hidden="true"></div>
  <NuxtPage />
</template>
