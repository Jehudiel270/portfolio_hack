<script setup lang="ts">
import { computed } from 'vue';
import { useFetch, useSeoMeta } from '#imports';
import { Activity, ArrowRight, ArrowUpRight, Award, BriefcaseBusiness, Check, Code2, GraduationCap, Mail, MapPin, Sparkles, Terminal, Workflow } from 'lucide-vue-next';
import ProjectCard from '~/components/ProjectCard.vue';
import ProjectTechnologyTags from '~/components/ProjectTechnologyTags.vue';
import TechnologyIcon from '~/components/TechnologyIcon.vue';
import { demoPortfolio, type PortfolioData } from '~/composables/usePortfolioData';
import { getSocialNetwork, resolveSocialLinks } from '~/composables/socialNetworks';
import { getAiTypeLabel } from '~/composables/aiCatalog';
import { usePublicSiteUrl } from '~/composables/usePublicSiteUrl';

const siteUrl = usePublicSiteUrl();
useSeoMeta({ title: 'Carrel DOSSOU — Développeur Full Stack', description: 'Portfolio de Carrel DOSSOU, développeur Full Stack au Bénin. Projets, parcours et compétences.', ogTitle: 'Carrel DOSSOU — Développeur Full Stack', ogDescription: 'Portfolio de Carrel DOSSOU, développeur Full Stack au Bénin. Projets, parcours et compétences.', ogUrl: siteUrl || undefined });
const { data } = await useFetch<PortfolioData>('/api/portfolio', { default: () => demoPortfolio });
const portfolio = computed(() => data.value || demoPortfolio);
const profile = computed(() => portfolio.value.profile);
const socialLinks = computed(() => resolveSocialLinks(profile.value.socialLinks, profile.value));
const projects = computed(() => {
  const items = [...portfolio.value.projects].sort((a, b) => a.sortOrder - b.sortOrder);
  const featured = items.filter((project) => project.featured);
  return featured.length ? featured : items;
});
const skills = computed(() => [...portfolio.value.skills].sort((a, b) => a.sortOrder - b.sortOrder));
const techs = computed(() => [...portfolio.value.technologies].sort((a, b) => a.sortOrder - b.sortOrder));
const aiTools = computed(() => techs.value.filter((technology) => technology.category === 'IA'));
const journey = computed(() => [...portfolio.value.journey].sort((a, b) => a.sortOrder - b.sortOrder));
const certifications = computed(() => [...portfolio.value.certifications].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 3));
function scrollToSection(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
</script>
<template>
  <div class="site-shell">
    <PortfolioHeader :configured="portfolio.configured" :source="portfolio.source" />
    <main class="shell-container">
      <section id="accueil" class="hero-stage">
        <WindowPanel title="Informations" class="info-window">
          <div class="info-body">
            <div v-if="profile.avatarUrl" class="profile-identity"><img :src="profile.avatarUrl" :alt="`Portrait de ${profile.name}`"><span><strong>{{ profile.name }}</strong><small>{{ profile.role }}</small></span></div>
            <div class="info-row"><span>Nom</span><span>: {{ profile.name }}</span></div><div class="info-row"><span>Poste</span><span>: {{ profile.role }}</span></div><div class="info-row"><span>Localisation</span><span>: {{ profile.location }}</span></div><div class="info-row"><span>Formation</span><span>: {{ profile.education }}</span></div><div class="info-row"><span>Statut</span><span>: {{ profile.available ? 'Ouvert aux opportunités' : 'En mission' }}</span></div>
            <div class="file-nav"><a href="#accueil" @click.prevent="scrollToSection('accueil')"><span class="file-icon">▱</span>/accueil</a><a href="#apropos"><span class="file-icon">▱</span>/a-propos</a><a href="#projets"><span class="file-icon">▱</span>/projets</a><a href="#competences"><span class="file-icon">▱</span>/competences</a><a href="#contact"><span class="file-icon">▱</span>/contact</a></div>
            <p class="terminal-note">// Toujours apprendre,<br>// toujours créer.</p>
          </div>
        </WindowPanel>
        <div class="window hero-main float-glow reveal">
          <div class="window-bar"><div class="window-title"><span class="prompt">&gt;_</span><span>Bienvenue dans mon univers</span></div><div class="window-controls"><i></i><i></i><i></i></div></div>
          <div class="eyebrow">Portfolio personnel · 2026</div>
          <h1><span class="greeting">Salut, moi c’est</span><span class="gradient-text glitch">{{ profile.name }}</span><span class="cursor" aria-hidden="true"></span></h1>
          <p class="lead">Je suis <strong>{{ profile.role }}</strong>, passionné par la technologie, les projets utiles et les univers digitaux qui sortent de l’ordinaire.</p>
          <div class="hero-actions"><a class="button" href="#projets">Voir mes projets <ArrowRight :size="16" /></a><a class="button secondary" href="#contact"><Mail :size="15" /> Me contacter</a><a v-if="portfolio.publicSettings?.cvUrl" class="button secondary" :href="portfolio.publicSettings.cvUrl" target="_blank" rel="noopener noreferrer">Télécharger mon CV ↗</a></div>
        </div>
        <aside class="hero-side">        <WindowPanel title="Mes technologies" class="tech-window"><div class="tech-grid"><div v-for="(tech, index) in techs.slice(0,8)" :key="tech.name" class="tech-item"><span :class="['tech-badge', { violet: index % 3 === 1 }]"><TechnologyIcon :name="tech.name" :icon="tech.icon" size="22" /></span><span>{{ tech.name }}</span></div></div><div class="tech-note">// Et bien d’autres encore...</div></WindowPanel></aside>
      </section>
      <section class="panel-row" aria-label="Résumé du portfolio">
        <WindowPanel title="Projets récents" class="content-panel">
          <div class="project-list"><NuxtLink v-for="project in projects.slice(0,3)" :key="project.slug" :to="`/projets/${project.slug}`" class="project-card"><span class="project-thumb"><img v-if="project.imageUrl" :src="project.imageUrl" :alt="project.title" loading="lazy"><Code2 v-else :size="23" /></span><span><span class="project-name">{{ project.title }}</span><span class="project-desc">{{ project.description }}</span><span v-if="project.categories?.length" class="tag-list project-category-tags"><span v-for="category in project.categories.slice(0,3)" :key="category" class="tag project-category-tag">{{ category }}</span></span><span class="tag-list"><ProjectTechnologyTags :tags="project.tags" :technologies="portfolio.technologies" :limit="2" :icon-size="14" /></span></span><ArrowRight class="project-arrow" :size="15" /></NuxtLink></div>
        </WindowPanel>
        <WindowPanel title="À propos" class="content-panel">
          <div class="window-body"><p>{{ profile.bio }}</p><div class="about-points"><span class="about-point"><Workflow :size="15" /> Full Stack Web &amp; Mobile</span><span class="about-point"><Sparkles :size="15" /> Passionné de jeux vidéo</span><span class="about-point"><Activity :size="15" /> Toujours en apprentissage</span><span class="about-point"><Check :size="15" /> Ouvert aux opportunités</span></div></div>
        </WindowPanel>
        <WindowPanel title="Compétences" class="content-panel">
          <div class="skill-list"><div v-for="skill in skills.slice(0,5)" :key="skill.name"><div class="skill-label"><span class="skill-name"><TechnologyIcon :name="skill.name" :icon="skill.icon" size="18" />{{ skill.name }}</span><span>{{ skill.level }}%</span></div><div class="skill-track"><span :style="{ width: `${skill.level}%` }"></span></div></div></div>
        </WindowPanel>
        <WindowPanel title="Contact" class="content-panel">
          <div class="contact-list">
            <div class="contact-line"><Mail :size="16" /><span>{{ profile.email || 'Écris-moi via le formulaire' }}</span></div>
            <div class="contact-line"><MapPin :size="16" /><span>{{ profile.location }}</span></div>
            <a v-for="link in socialLinks" :key="link.platform" class="contact-line" :href="link.url" :aria-label="`Ouvrir le profil ${getSocialNetwork(link.platform)?.label||link.platform}`" target="_blank" rel="noopener noreferrer">
              <TechnologyIcon :name="link.customLabel||getSocialNetwork(link.platform)?.label||link.platform" :icon="link.customIcon||getSocialNetwork(link.platform)?.icon" size="16" />
              <span>{{ link.customLabel||getSocialNetwork(link.platform)?.label||link.platform }}</span>
            </a>
          </div>
          <div class="code-note">// Discutons de ton projet<br>// ou juste pour échanger !</div>
        </WindowPanel>
      </section>
      <section id="apropos" class="section">
        <div class="section-head"><div><div class="eyebrow">01 / Profil</div><h2>Un peu plus <span class="gradient-text">sur moi</span></h2></div><p class="section-sub">// Parcours, curiosité et code</p></div>
        <div class="timeline"><article v-for="item in journey" :key="`${item.organization}-${item.startDate}`" class="window timeline-card"><GraduationCap class="timeline-mark" :size="19" /><img v-if="item.imageUrl" class="journey-image" :src="item.imageUrl" :alt="`Visuel associé à ${item.role} chez ${item.organization}`" loading="lazy"><span class="date">{{ item.startDate }} — {{ item.endDate || 'Aujourd’hui' }}</span><h3>{{ item.role }}</h3><p class="mono" style="color:#6cdff0;margin-bottom:7px">{{ item.organization }}<span v-if="item.location"> · {{ item.location }}</span></p><p>{{ item.description }}</p></article></div>
      </section>
      <section id="projets" class="section">
        <div class="section-head"><div><div class="eyebrow">02 / Sélection</div><h2>Projets <span class="gradient-text">récents</span></h2></div><p class="section-sub">// Des idées devenues interfaces</p></div>
        <div class="project-grid"><ProjectCard v-for="project in projects" :key="project.slug" :project="project" :technologies="portfolio.technologies" /></div>
      </section>
      <section id="competences" class="section">
        <div class="section-head"><div><div class="eyebrow">03 / Stack</div><h2>Outils et <span class="gradient-text">savoir-faire</span></h2></div><p class="section-sub">// Curieux de la stack à la livraison</p></div>
        <div class="panel-row">
          <WindowPanel title="Technologies" class="content-panel"><div class="tech-grid" style="grid-template-columns:repeat(4,1fr)"><div v-for="(tech,index) in techs" :key="tech.name" class="tech-item"><span :class="['tech-badge',{violet:index%3===1}]"><TechnologyIcon :name="tech.name" :icon="tech.icon" size="22" /></span><span>{{ tech.name }}</span></div></div></WindowPanel>
          <WindowPanel title="Compétences clés" class="content-panel"><div class="skill-list"><div v-for="skill in skills" :key="skill.name"><div class="skill-label"><span class="skill-name"><TechnologyIcon :name="skill.name" :icon="skill.icon" size="18" />{{ skill.name }}</span><span>{{ skill.level }}%</span></div><div class="skill-track"><span :style="{width:`${skill.level}%`}"></span></div></div></div></WindowPanel>
        </div>
      </section>
      <section v-if="aiTools.length" id="intelligence-artificielle" class="section ai-section">
        <div class="section-head"><div><div class="eyebrow">04 / Intelligence artificielle</div><h2>IA, modèles <span class="gradient-text">&amp; assistants</span></h2></div><NuxtLink class="text-link" to="/ia">Explorer mon univers IA <ArrowUpRight :size="14" /></NuxtLink></div>
        <div class="ai-tool-grid">
          <article v-for="tool in aiTools" :key="tool.id || tool.name" class="window ai-tool-card">
            <TechnologyIcon :name="tool.name" :icon="tool.icon" size="31" />
            <span>{{ tool.name }}</span>
            <span class="ai-tool-type">{{ getAiTypeLabel(tool.aiType) }}</span>
          </article>
        </div>
      </section>
      <section v-if="certifications.length" class="section">
        <div class="section-head"><div><div class="eyebrow">05 / Validation des acquis</div><h2>Certifications <span class="gradient-text">&amp; attestations</span></h2></div><NuxtLink class="text-link" to="/certifications">Toutes les certifications <ArrowUpRight :size="14" /></NuxtLink></div>
        <div class="certification-grid">
          <article v-for="item in certifications" :key="item.id || `${item.issuer}-${item.title}`" class="window certification-card">
            <img v-if="item.imageUrl" class="certification-badge" :src="item.imageUrl" :alt="`Badge de certification ${item.title}`" loading="lazy">
            <Award v-else class="certification-icon" :size="27" />
            <div class="certification-copy"><span class="mono certification-issuer">{{ item.issuer }}</span><h3>{{ item.title }}</h3><p v-if="item.issuedAt" class="date">Obtenue : {{ item.issuedAt }}</p></div>
          </article>
        </div>
      </section>
      <section v-if="portfolio.testimonials.length" class="section">
        <div class="section-head"><div><div class="eyebrow">Retours</div><h2>Ils en parlent <span class="gradient-text">mieux que moi</span></h2></div><p class="section-sub">// Citations publiées avec autorisation</p></div>
        <div class="testimonial-grid">
          <figure v-for="item in portfolio.testimonials" :key="item.id || item.author" class="window testimonial-card">
            <blockquote>{{ item.quote }}</blockquote>
            <figcaption><strong>{{ item.author }}</strong><span>{{ [item.role,item.organization].filter(Boolean).join(' · ') }}</span></figcaption>
          </figure>
        </div>
      </section>
      <section id="contact" class="section">
        <div class="section-head"><div><div class="eyebrow">07 / Canal ouvert</div><h2>On construit <span class="gradient-text">quelque chose ?</span></h2></div><p class="section-sub">// Réponse dès que possible</p></div>
        <div class="contact-layout">
          <div class="window contact-card">
            <div class="eyebrow">Contact direct</div>
            <h3>Une idée en tête ?</h3>
            <p class="muted">Parlons de ton projet, d’une collaboration ou simplement de ce que tu construis.</p>
            <div class="contact-list">
              <div class="contact-line"><MapPin :size="16" /><span>{{ profile.location }}</span></div>
              <div v-if="profile.email" class="contact-line"><Mail :size="16" /><a :href="`mailto:${profile.email}`">{{ profile.email }}</a></div>
              <a v-for="link in socialLinks" :key="link.platform" class="contact-line" :href="link.url" :aria-label="`Ouvrir le profil ${link.customLabel||getSocialNetwork(link.platform)?.label||link.platform}`" target="_blank" rel="noopener noreferrer">
                <TechnologyIcon :name="link.customLabel||getSocialNetwork(link.platform)?.label||link.platform" :icon="link.customIcon||getSocialNetwork(link.platform)?.icon" size="16" />
                <span>{{ link.customLabel||getSocialNetwork(link.platform)?.label||link.platform }}</span>
                <ArrowUpRight :size="13" />
              </a>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
      <footer class="footer"><span>© 2026 · {{ profile.name }} — Portfolio Full Stack</span><span>Assemblé avec <span style="color:var(--cyan)">☾</span> et beaucoup de café</span><a href="#accueil">retour au sommet ↑</a></footer>
    </main>
  </div>
</template>
