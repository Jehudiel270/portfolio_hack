<script setup lang="ts">
import { useFetch, useSeoMeta } from '#imports';
import { demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';

useSeoMeta({
  title: 'Confidentialité — Carrel DOSSOU',
  description: 'Informations sur les données du formulaire de contact et les statistiques de consultation du portfolio.',
  robots: 'index, follow',
});
const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
</script>

<template>
  <div class="site-shell">
    <PortfolioHeader :configured="data?.configured || false" :source="data?.source || 'demo'" />
    <main class="shell-container route-page">
      <header class="section-head"><div><div class="eyebrow">Informations</div><h1>Confidentialité</h1></div></header>
      <section class="window privacy-copy">
        <h2>Formulaire de contact</h2>
        <p>Le nom, l’adresse e-mail, le sujet et le message sont conservés dans l’espace propriétaire pour traiter la demande. Le message peut aussi être transmis par e-mail au destinataire configuré. Ne saisis pas de données sensibles.</p>
        <p>Les messages sont conservés pendant une durée limitée, puis supprimés. Pour demander la suppression d’un message, utilise la page de contact.</p>
        <h2>Statistiques de consultation</h2>
        <p>Le site compte les pages consultées par jour sous forme agrégée, sans cookie analytique, adresse IP, identifiant de visiteur ni empreinte de navigateur. Les pages de détail de projet sont regroupées.</p>
        <h2>Demande concernant tes données</h2>
        <p>Pour demander l’accès, la rectification ou la suppression d’un message, contacte le propriétaire via la <NuxtLink to="/contact">page de contact</NuxtLink>.</p>
      </section>
    </main>
  </div>
</template>
