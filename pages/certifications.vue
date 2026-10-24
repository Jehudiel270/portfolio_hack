<script setup lang="ts">
import { computed } from 'vue';
import { Award, ExternalLink } from 'lucide-vue-next';
import { useFetch, useSeoMeta } from '#imports';
import { demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';

useSeoMeta({
  title: 'Certifications — Carrel DOSSO',
  description: 'Certifications professionnelles et attestations vérifiables présentées par Carrel DOSSO.',
});

const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const portfolio = computed(() => data.value || demoPortfolio);
const certifications = computed(() => [...portfolio.value.certifications].sort((a, b) => a.sortOrder - b.sortOrder));

function expirationLabel(date: string | null) {
  if (!date) return '';
  const expiresAt = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? Date.parse(`${date}T23:59:59.999`)
    : Date.parse(date);
  if (!Number.isFinite(expiresAt)) return 'Échéance indiquée';
  return expiresAt < Date.now() ? 'Expirée' : 'Valide';
}
</script>

<template>
  <div class="site-shell">
    <PortfolioHeader :configured="portfolio.configured" :source="portfolio.source" />
    <main class="shell-container route-page">
      <header class="section-head">
        <div><div class="eyebrow">07 / Validation des acquis</div><h1>Mes <span class="gradient-text">certifications</span></h1></div>
        <p class="section-sub">// Titres et attestations vérifiables</p>
      </header>
      <div v-if="certifications.length" class="certification-grid">
        <article v-for="item in certifications" :key="item.id || `${item.issuer}-${item.title}`" class="window certification-card">
          <img v-if="item.imageUrl" class="certification-badge" :src="item.imageUrl" :alt="`Badge de certification ${item.title}`" loading="lazy">
          <Award v-else class="certification-icon" :size="27" />
          <div class="certification-copy">
            <span class="mono certification-issuer">{{ item.issuer }}</span>
            <h2>{{ item.title }}</h2>
            <p v-if="item.description">{{ item.description }}</p>
            <dl class="certification-details">
              <div v-if="item.issuedAt"><dt>Obtenue</dt><dd>{{ item.issuedAt }}</dd></div>
              <div v-if="item.expiresAt"><dt>Expiration</dt><dd>{{ item.expiresAt }}</dd></div>
              <div v-if="item.credentialId"><dt>Identifiant</dt><dd>{{ item.credentialId }}</dd></div>
            </dl>
            <ul v-if="item.skills.length" class="certification-skills" aria-label="Compétences associées">
              <li v-for="skill in item.skills" :key="skill">{{ skill }}</li>
            </ul>
            <span v-if="item.expiresAt" :class="['certification-status', { expired: expirationLabel(item.expiresAt) === 'Expirée' }]">
              {{ expirationLabel(item.expiresAt) }}
            </span>
            <a v-if="item.credentialUrl" class="button secondary certification-verify" :href="item.credentialUrl" target="_blank" rel="noopener noreferrer">
              Vérifier le certificat <ExternalLink :size="14" />
            </a>
          </div>
        </article>
      </div>
      <section v-else class="window certification-empty">
        <Award :size="30" />
        <h2>Aucune certification publiée pour le moment</h2>
        <p>Les certifications et attestations vérifiables seront présentées ici prochainement.</p>
      </section>
    </main>
  </div>
</template>
