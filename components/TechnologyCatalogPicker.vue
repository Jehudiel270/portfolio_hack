<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TechnologyCatalogItem } from '~/composables/usePortfolioData';
import TechnologyIcon from '~/components/TechnologyIcon.vue';

const props = defineProps<{
  items: TechnologyCatalogItem[];
  saved: TechnologyCatalogItem[];
  categoryFilter?: string;
  source: string;
  warning: string;
  loading: boolean;
}>();
const emit = defineEmits<{ select: [item: TechnologyCatalogItem]; edit: [item: TechnologyCatalogItem]; retry: [] }>();
const query = ref('');
const activeCategory = ref('');
const categories = computed(() => [...new Set(props.items
  .filter((item) => !props.categoryFilter || item.category === props.categoryFilter)
  .map((item) => item.category || 'Autres technologies'))].sort((a, b) => a.localeCompare(b, 'fr')));
const filteredItems = computed(() => {
  const search = query.value.trim().toLocaleLowerCase('fr');
  const categoryMatches = props.categoryFilter
    ? props.items.filter((item) => item.category === props.categoryFilter)
    : props.items;
  const grouped = activeCategory.value
    ? categoryMatches.filter((item) => (item.category || 'Autres technologies') === activeCategory.value)
    : categoryMatches;
  const matches = search
    ? grouped.filter((item) => item.name.toLocaleLowerCase('fr').includes(search) || item.icon.toLowerCase().includes(search))
    : grouped;
  return matches;
});
</script>

<template>
  <section class="technology-catalog window">
    <div class="catalog-heading">
      <div>
        <h2>Catalogue officiel des technologies</h2>
        <p class="muted">{{ filteredItems.length.toLocaleString('fr-FR') }} résultats affichés sur {{ items.length.toLocaleString('fr-FR') }} logos Iconify. Les collections incluent langages, frameworks, outils et IA. Le nom et l’icône restent modifiables.</p>
      </div>
      <span v-if="source" class="status-chip">{{ source === 'Iconify' ? 'Catalogue en ligne' : 'Liste locale' }}</span>
    </div>
    <div v-if="warning" class="catalog-status admin-alert" role="status"><span>{{ warning }}</span><button class="button secondary" type="button" :disabled="loading" @click="emit('retry')">{{ loading?'Actualisation…':'Réessayer' }}</button></div>
    <div v-else-if="loading" class="catalog-loading" role="status"><span class="catalog-loading-indicator"></span>Connexion au catalogue… Le chargement local reste disponible.</div>
    <label class="field catalog-search">
      <span>Rechercher une technologie</span>
      <input v-model="query" type="search" placeholder="Vue.js, logos:vue, Tailwind…">
    </label>
    <label v-if="!categoryFilter" class="field catalog-category-filter">
      <span>Famille</span>
      <select v-model="activeCategory">
        <option value="">Toutes les familles ({{ items.length }})</option>
        <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
      </select>
    </label>
    <div v-if="filteredItems.length" class="catalog-grid">
      <button v-for="item in filteredItems" :key="item.icon" class="catalog-item" type="button" @click="emit('select', item)">
        <TechnologyIcon :name="item.name" :icon="item.icon" size="25" />
        <span>{{ item.name }}</span>
        <small>{{ item.category || item.icon }}</small>
      </button>
    </div>
    <p v-else-if="loading" class="admin-empty">Le catalogue se prépare…</p>
    <p v-else class="admin-empty">Aucun résultat. Tu peux quand même ajouter une technologie manuellement.</p>
    <h3 class="catalog-saved-heading">{{ categoryFilter === 'IA' ? 'IA enregistrées' : 'Éléments enregistrés' }}</h3>
    <div v-if="saved.length" class="catalog-grid saved-technologies">
      <button v-for="item in saved" :key="item.icon + item.name" class="catalog-item" type="button" @click="emit('edit', item)">
        <TechnologyIcon :name="item.name" :icon="item.icon" size="25" />
        <span>{{ item.name }}</span>
        <small>{{ item.category }}</small>
      </button>
    </div>
    <p v-else class="muted">Aucune technologie enregistrée pour l’instant.</p>
    <p class="muted catalog-custom-note">Icône personnalisée : URL d’image, <code>logos:nom-du-logo</code> ou texte préfixé par <code>text:</code>.</p>
  </section>
</template>
