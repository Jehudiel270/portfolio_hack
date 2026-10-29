<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Check, Clock3, LoaderCircle, Sparkles, Undo2 } from 'lucide-vue-next';
import { AI_DRAFT_FIELDS, AI_TEXT_PROVIDERS, type AiDraftResource, type AiProvider, type AiTextProvider } from '~/shared/adminAi';

const props = defineProps<{
  resource: AiDraftResource;
  current: Record<string, unknown>;
}>();
type ProviderOption = { id: AiProvider; label: string; configured: boolean; model: string; availableModels?: Array<{ id: string; label: string; description: string }> };
type TextProviderOption = Omit<ProviderOption, 'id'> & { id: AiTextProvider };
const emit = defineEmits<{
  apply: [draft: Record<string, unknown>];
  restore: [snapshot: Record<string, unknown>];
}>();
const instructions = ref('');
const consent = ref(false);
const busy = ref(false);
const error = ref('');
const draft = ref<Record<string, unknown> | null>(null);
const modelUsed = ref('');
const providers = ref<TextProviderOption[]>([]);
const selectedProvider = ref<AiTextProvider>('gemini');
const selectedModel = ref('');
const selectedProviderConfigured = computed(() => providers.value.some(provider => provider.id === selectedProvider.value && provider.configured));
const selectedProviderOption = computed(() => providers.value.find(provider => provider.id === selectedProvider.value));
const selectedModelOptions = computed(() => selectedProviderOption.value?.availableModels?.length ? selectedProviderOption.value.availableModels : [{ id: selectedProviderOption.value?.model || '', label: selectedProviderOption.value?.model || 'Modèle par défaut', description: 'Modèle actuellement configuré comme valeur par défaut.' }]);
const selectedModelDescription = computed(() => selectedModelOptions.value.find(model => model.id === selectedModel.value)?.description || 'Modèle utilisé uniquement pour cette génération.');

function selectProvider(provider: AiTextProvider) {
  selectedProvider.value = provider;
  const option = providers.value.find(item => item.id === provider);
  selectedModel.value = option?.model || option?.availableModels?.[0]?.id || '';
}

watch(selectedProvider, (provider) => selectProvider(provider));
const selectedHistoryId = ref('');
const draftHistory = ref<Array<{
  id: number;
  createdAt: string;
  instructions: string;
  draft: Record<string, unknown>;
  appliedCount: number;
}>>([]);
const appliedSnapshots = ref<Array<{ historyId: number; values: Record<string, unknown> }>>([]);
let nextHistoryId = 0;
const fieldLabels: Record<string, string> = {
  title: 'Titre',
  slug: 'Identifiant URL',
  description: 'Description',
  tags: 'Technologies',
  categories: 'Catégories',
  demoUrl: 'Lien de démonstration',
  repoUrl: 'Dépôt GitHub',
  year: 'Année',
  projectType: 'Type de projet',
  caseRole: 'Rôle',
  caseContext: 'Contexte',
  responsibilities: 'Responsabilités',
  outcomes: 'Résultats',
  role: 'Poste',
  organization: 'Organisation',
  location: 'Lieu',
  startDate: 'Date de début',
  endDate: 'Date de fin',
  institution: 'Établissement',
  degree: 'Diplôme',
  status: 'Statut',
  issuer: 'Organisme',
  issuedAt: 'Date d’obtention',
  expiresAt: 'Date d’expiration',
  skills: 'Compétences',
  date: 'Date',
  name: 'Nom',
  icon: 'Icône',
  level: 'Niveau',
  category: 'Catégorie',
  aiType: 'Type IA',
  aiAccessMode: 'Mode d’accès',
  aiUseCases: 'Usages',
  aiVerifiedAt: 'Date de vérification',
  author: 'Auteur',
  quote: 'Citation',
  bio: 'Présentation',
  education: 'Formation',
  metrics: 'Métriques',
  officialUrl: 'Lien officiel',
};

onMounted(async () => {
  try {
    const result = await $fetch<{ providers: ProviderOption[] }>('/api/admin/ai/providers');
    providers.value = result.providers.filter((provider): provider is TextProviderOption => AI_TEXT_PROVIDERS.some(id => id === provider.id));
    const configured = providers.value.find((provider) => provider.configured);
    if (configured) selectProvider(configured.id);
  } catch {
    error.value = 'Impossible de charger la liste des fournisseurs IA.';
  }
});

async function generateDraft() {
  error.value = '';
  draft.value = null;
  if (!consent.value) {
    error.value = 'Confirme l’envoi des champs sélectionnés au fournisseur choisi avant de continuer.';
    return;
  }
  if (instructions.value.trim().length < 4) {
    error.value = 'Décris en quelques mots ce que tu veux préparer.';
    return;
  }
  busy.value = true;
  try {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith('carrel_admin_csrf='));
    const csrf = cookie?.slice('carrel_admin_csrf='.length) || '';
    const current = Object.fromEntries(Object.entries(props.current).filter(([, value]) =>
      value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0),
    ));
    const response = await $fetch<{ draft: Record<string, unknown>; model: string; provider: string }>('/api/admin/ai/draft', {
      method: 'POST',
      body: { resource: props.resource, provider: selectedProvider.value, model: selectedModel.value || undefined, instructions: instructions.value.trim(), current },
      headers: { 'x-admin-csrf': csrf },
    });
    draft.value = response.draft;
    modelUsed.value = `${providers.value.find((provider) => provider.id === response.provider)?.label || response.provider} · ${response.model}`;
    const historyId = nextHistoryId++;
    selectedHistoryId.value = String(historyId);
    draftHistory.value.unshift({
      id: historyId,
      createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      instructions: instructions.value.trim(),
      draft: response.draft,
      appliedCount: 0,
    });
    draftHistory.value = draftHistory.value.slice(0, 10);
  } catch (cause: unknown) {
    if (cause && typeof cause === 'object') {
      const request = cause as { data?: { statusMessage?: unknown }; statusMessage?: unknown };
      const message = request.data?.statusMessage || request.statusMessage;
      error.value = typeof message === 'string' ? message : 'Le fournisseur IA n’a pas pu préparer le brouillon.';
    } else {
      error.value = 'Le fournisseur IA n’a pas pu préparer le brouillon.';
    }
  } finally {
    busy.value = false;
  }
}

function displayValue(value: unknown) {
  if (Array.isArray(value)) return value.map(item => typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)).join(', ');
  return value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
}

function selectHistory(entry: (typeof draftHistory.value)[number]) {
  selectedHistoryId.value = String(entry.id);
  draft.value = entry.draft;
  instructions.value = entry.instructions;
}

function applyDraft() {
  if (!draft.value) return;
  const historyId = Number(selectedHistoryId.value);
  appliedSnapshots.value.push({
    historyId,
    values: Object.fromEntries(Object.entries(props.current).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value,
    ])),
  });
  const entry = draftHistory.value.find((item) => item.id === historyId);
  if (entry) entry.appliedCount += 1;
  emit('apply', draft.value);
  error.value = '';
}

function undoLastApply() {
  const previous = appliedSnapshots.value.pop();
  if (!previous) return;
  const entry = draftHistory.value.find((item) => item.id === previous.historyId);
  if (entry) entry.appliedCount = Math.max(0, entry.appliedCount - 1);
  emit('restore', previous.values);
}

const allowedFields = AI_DRAFT_FIELDS[props.resource] as readonly string[];
</script>

<template>
  <section class="admin-gemini-assistant">
    <div class="admin-gemini-heading">
      <div><h3><Sparkles :size="16" /> Assistant IA</h3><p>Prépare un brouillon sur cette fiche. Tu le relis et l’enregistres toi-même.</p></div>
      <span class="admin-gemini-model">{{ modelUsed || 'Fournisseur au choix' }}</span>
    </div>
    <label class="admin-gemini-provider">Fournisseur de rédaction
      <select v-model="selectedProvider" @change="selectProvider(selectedProvider)">
        <option v-for="provider in providers" :key="provider.id" :value="provider.id" :disabled="!provider.configured">{{ provider.label }} · {{ provider.configured ? provider.model : 'clé non configurée' }}</option>
      </select>
    </label>
    <label class="admin-gemini-provider">Modèle pour cette génération
      <select v-model="selectedModel" :disabled="!selectedProviderConfigured">
        <option v-for="model in selectedModelOptions" :key="model.id" :value="model.id">{{ model.label }} · {{ model.id }}</option>
      </select>
    </label>
    <div class="admin-gemini-model-description"><strong>{{ selectedModelOptions.find(model => model.id === selectedModel)?.label || selectedModel }}</strong><p>{{ selectedModelDescription }}</p></div>
    <label class="admin-gemini-prompt">Que veux-tu améliorer ou compléter ?
      <textarea v-model="instructions" rows="3" maxlength="1000" placeholder="Ex. Reformule la description pour mettre l’accent sur les objectifs et le travail réellement réalisé."></textarea>
    </label>
    <label class="admin-gemini-consent"><input v-model="consent" type="checkbox"><span>J’accepte d’envoyer ma demande et les champs affichés au fournisseur choisi. Pour un projet, son dépôt explicitement saisi ou les dépôts trouvés avec tous les comptes GitHub configurés peuvent être transmis comme contexte. Seul Gemini peut aussi consulter l’URL de démo.</span></label>
    <p class="admin-gemini-privacy">Le modèle ne peut modifier que les champs listés pour cette fiche. Tu peux relire, annuler ou modifier le résultat avant d’enregistrer. L’historique reste dans cette édition; aucun brouillon n’est sauvegardé automatiquement.</p>
    <p v-if="error" class="admin-alert error" role="alert">{{ error }}</p>
    <button class="button secondary" type="button" :disabled="busy||!consent||!selectedProviderConfigured||instructions.trim().length<4" @click="generateDraft">
      <LoaderCircle v-if="busy" :size="15" class="admin-spinner" /><Sparkles v-else :size="15" />{{ busy?'Préparation du brouillon…':'Générer un brouillon' }}
    </button>
    <div v-if="draft" class="admin-gemini-draft" aria-live="polite">
      <strong>Brouillon à relire</strong>
      <dl>
        <div v-for="key in allowedFields.filter((field)=>Object.hasOwn(draft || {},field))" :key="key">
          <dt>{{ fieldLabels[key]||key }}</dt><dd>{{ displayValue(draft[key]) }}</dd>
        </div>
      </dl>
      <div class="admin-gemini-draft-actions">
        <button class="button" type="button" @click="applyDraft"><Check :size="15" /> Appliquer au formulaire</button>
        <button v-if="appliedSnapshots.length" class="button secondary" type="button" @click="undoLastApply"><Undo2 :size="15" /> Annuler la dernière application</button>
      </div>
    </div>
    <div v-if="draftHistory.length" class="admin-gemini-history">
      <strong><Clock3 :size="14" /> Historique de cette édition</strong>
      <button
        v-for="entry in draftHistory"
        :key="entry.id"
        type="button"
        :class="{ 'is-selected': selectedHistoryId === String(entry.id) }"
        @click="selectHistory(entry)"
      >
        <span>{{ entry.createdAt }} · {{ entry.instructions }}</span>
        <small>{{ entry.appliedCount ? `Appliqué ${entry.appliedCount} fois` : 'Brouillon non appliqué' }}</small>
      </button>
    </div>
  </section>
</template>
