<script setup lang="ts">
import { computed } from 'vue';
import { Mail, MapPin } from 'lucide-vue-next';
import { useFetch, useSeoMeta } from '#imports';
import TechnologyIcon from '~/components/TechnologyIcon.vue';
import { getSocialNetwork, resolveSocialLinks } from '~/composables/socialNetworks';
import { demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';

useSeoMeta({
  title: 'Contact — Carrel DOSSO',
  description: 'Contacter Carrel DOSSO pour un projet, une collaboration ou une question.',
});

const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const portfolio = computed(() => data.value || demoPortfolio);
const profile = computed(() => portfolio.value.profile);
const socialLinks = computed(() => resolveSocialLinks(profile.value.socialLinks, profile.value));
</script>

<template>
  <div class="site-shell">
    <PortfolioHeader :configured="portfolio.configured" :source="portfolio.source" />
    <main class="shell-container route-page">
      <header class="section-head">
        <div><div class="eyebrow">05 / Canal ouvert</div><h1>Parlons de <span class="gradient-text">ton projet</span></h1></div>
        <p class="section-sub">// Une idée, une question ou une collaboration</p>
      </header>
      <div class="contact-layout">
        <section class="window contact-card">
          <div class="eyebrow">Contact direct</div>
          <h2>Une idée en tête ?</h2>
          <p class="muted">Parlons d’un projet, d’une collaboration ou simplement de ce que tu construis.</p>
          <div class="contact-list">
            <div class="contact-line"><MapPin :size="16" /><span>{{ profile.location }}</span></div>
            <a v-if="profile.email" class="contact-line" :href="`mailto:${profile.email}`"><Mail :size="16" /><span>{{ profile.email }}</span></a>
            <a
              v-for="link in socialLinks"
              :key="link.platform"
              class="contact-line"
              :href="link.url"
              :aria-label="`Ouvrir le profil ${link.customLabel || getSocialNetwork(link.platform)?.label || link.platform}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <TechnologyIcon :name="link.customLabel || getSocialNetwork(link.platform)?.label || link.platform" :icon="link.customIcon || getSocialNetwork(link.platform)?.icon" size="16" />
              <span>{{ link.customLabel || getSocialNetwork(link.platform)?.label || link.platform }}</span>
            </a>
          </div>
          <p class="privacy-notice">L’envoi conserve les informations nécessaires pour répondre. <NuxtLink to="/confidentialite">Lire la politique de confidentialité</NuxtLink>.</p>
          <a v-if="portfolio.publicSettings?.appointmentUrl" class="button secondary appointment-link" :href="portfolio.publicSettings.appointmentUrl" target="_blank" rel="noopener noreferrer">Choisir un créneau de rendez-vous ↗</a>
          <div v-if="portfolio.publicSettings?.missionTypes?.length" class="mission-types"><strong>Types de mission</strong><span v-for="type in portfolio.publicSettings.missionTypes" :key="type" class="tag">{{ type }}</span></div>
        </section>
        <ContactForm />
      </div>
    </main>
  </div>
</template>
