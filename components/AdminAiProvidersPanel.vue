<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { CheckCircle2, Loader2, RotateCw, Save, Trash2 } from 'lucide-vue-next';
import type { AiProvider } from '~/shared/adminAi';

type ProviderRow = {
  id: AiProvider;
  label: string;
  defaultModel: string;
  capabilities: string[];
  balance: string;
  configured: boolean;
  managedInDashboard: boolean;
  model: string;
};
type UsageRow = { day: string; provider: string; requests: number; inputTokens: number; outputTokens: number };
const providers = ref<ProviderRow[]>([]);
const usage = ref<UsageRow[]>([]);
const keys = reactive<Record<string, string>>({});
const models = reactive<Record<string, string>>({});
const saving = ref('');
const testing = ref('');
const error = ref('');
const notice = ref('');
const testResults = reactive<Record<string, string>>({});
function csrfHeaders() {
  const csrf = document.cookie.split('; ').find(item => item.startsWith('carrel_admin_csrf='))?.slice('carrel_admin_csrf='.length) || '';
  return { 'x-admin-csrf': csrf };
}

function getError(cause: unknown) {
  if (cause && typeof cause === 'object') {
    const request = cause as { data?: { statusMessage?: unknown }; statusMessage?: unknown };
    const message = request.data?.statusMessage || request.statusMessage;
    if (typeof message === 'string') return message;
  }
  return 'La demande au serveur a échoué.';
}

async function load() {
  error.value = '';
  const [providerResponse, usageResponse] = await Promise.all([
    $fetch<{ providers: ProviderRow[] }>('/api/admin/ai/providers'),
    $fetch<UsageRow[]>('/api/admin/ai/usage'),
  ]);
  providers.value = providerResponse.providers;
  usage.value = usageResponse;
  for (const provider of providers.value) models[provider.id] = provider.model || provider.defaultModel;
}

async function refresh() {
  try {
    await load();
  } catch (cause) {
    error.value = getError(cause);
  }
}

async function save(provider: ProviderRow) {
  error.value = '';
  notice.value = '';
  saving.value = provider.id;
  try {
    await $fetch(`/api/admin/ai/providers/${provider.id}`, {
      method: 'PUT',
      body: { apiKey: keys[provider.id] || undefined, model: models[provider.id] || provider.defaultModel },
      headers: csrfHeaders(),
    });
    keys[provider.id] = '';
    notice.value = `${provider.label} enregistré. La clé reste chiffrée côté serveur.`;
    await load();
  } catch (cause) {
    error.value = getError(cause);
  } finally {
    saving.value = '';
  }
}

async function test(provider: ProviderRow) {
  error.value = '';
  notice.value = '';
  testing.value = provider.id;
  try {
    const result = await $fetch<{ quota: null | { remaining: number | null; limit: number | null; resetsAt: string | null } }>(`/api/admin/ai/providers/${provider.id}/test`, {
      method: 'POST',
      headers: csrfHeaders(),
    });
    testResults[provider.id] = result.quota
      ? `Connexion OK · ${result.quota.remaining ?? '—'} / ${result.quota.limit ?? '—'} appels restants${result.quota.resetsAt ? ` · réinitialisation ${new Date(result.quota.resetsAt).toLocaleString('fr-FR')}` : ''}`
      : 'Connexion vérifiée. Le fournisseur ne publie pas de solde via cette API.';
  } catch (cause) {
    error.value = `${provider.label} : ${getError(cause)}`;
  } finally {
    testing.value = '';
  }
}

async function remove(provider: ProviderRow) {
  if (!confirm(`Retirer la clé ${provider.label} du coffre ? Cette action ne résilie pas l’abonnement fournisseur.`)) return;
  error.value = '';
  notice.value = '';
  saving.value = provider.id;
  try {
    await $fetch(`/api/admin/ai/providers/${provider.id}`, { method: 'DELETE', headers: csrfHeaders() });
    notice.value = `${provider.label} retiré du coffre.`;
    await load();
  } catch (cause) {
    error.value = getError(cause);
  } finally {
    saving.value = '';
  }
}

function usageFor(provider: string) {
  return usage.value.filter(row => row.provider === provider).reduce((total, row) => ({
    requests: total.requests + row.requests,
    input: total.input + row.inputTokens,
    output: total.output + row.outputTokens,
  }), { requests: 0, input: 0, output: 0 });
}

onMounted(() => {
  void refresh();
});
</script>

<template>
  <section class="window admin-ai-provider-panel">
    <header>
      <div><h2>Fournisseurs et coffre de clés</h2><p class="muted">Les clés sont chiffrées en base avec une clé dérivée de NUXT_SESSION_PASSWORD et ne sont jamais renvoyées au navigateur.</p></div>
      <button class="button secondary" type="button" @click="refresh"><RotateCw :size="14" /> Actualiser</button>
    </header>
    <p v-if="error" class="admin-alert error" role="alert">{{ error }}</p>
    <p v-if="notice" class="admin-alert success" role="status">{{ notice }}</p>
    <div v-if="providers.length" class="admin-ai-provider-grid">
      <article v-for="provider in providers" :key="provider.id" class="admin-ai-provider-card">
        <div class="admin-ai-provider-card__heading">
          <div><h3>{{ provider.label }}</h3><span :class="['status-chip', provider.configured ? 'is-configured' : '']">{{ provider.configured ? 'Clé configurée' : 'Non configuré' }}</span></div>
        </div>
        <small v-if="provider.configured&&!provider.managedInDashboard" class="muted">Clé héritée de l’environnement serveur. Enregistre-la ici pour la chiffrer dans le coffre.</small>
        <p>{{ provider.capabilities.join(' · ') }}</p>
        <label>Modèle / API
          <input v-model.trim="models[provider.id]" :disabled="provider.id === 'github'" :placeholder="provider.defaultModel" maxlength="120">
        </label>
        <label v-if="provider.id !== 'github'">Clé API
          <input v-model="keys[provider.id]" type="password" autocomplete="new-password" :placeholder="provider.configured ? provider.managedInDashboard ? 'Laisser vide pour conserver la clé' : 'Clé d’environnement détectée · optionnel pour la chiffrer en base' : 'Coller la clé secrète ici'" maxlength="500">
        </label>
        <label v-else>Jeton GitHub en lecture seule
          <input v-model="keys[provider.id]" type="password" autocomplete="new-password" :placeholder="provider.configured ? 'Laisser vide pour conserver le jeton' : 'Facultatif · fine-grained read-only'" maxlength="500">
        </label>
        <small class="muted">{{ provider.balance }}</small>
        <small v-if="provider.id !== 'github' && provider.configured" class="muted">Usage local · {{ usageFor(provider.id).requests }} requêtes · {{ usageFor(provider.id).input }} jetons entrée / {{ usageFor(provider.id).output }} sortie (30 jours). Le coût exact est calculé par le fournisseur.</small>
        <small v-if="testResults[provider.id]" class="admin-ai-provider-test" role="status"><CheckCircle2 :size="14" /> {{ testResults[provider.id] }}</small>
        <div class="admin-ai-provider-actions">
          <button class="button" type="button" :disabled="saving===provider.id" @click="save(provider)"><Loader2 v-if="saving===provider.id" :size="14" class="admin-spinner" /><Save v-else :size="14" /> Enregistrer</button>
          <button class="button secondary" type="button" :disabled="!provider.configured||testing===provider.id" @click="test(provider)"><Loader2 v-if="testing===provider.id" :size="14" class="admin-spinner" /><CheckCircle2 v-else :size="14" /> Tester</button>
          <button v-if="provider.managedInDashboard" class="icon-button danger" type="button" :disabled="saving===provider.id" :aria-label="`Retirer ${provider.label}`" @click="remove(provider)"><Trash2 :size="14" /></button>
        </div>
      </article>
    </div>
    <p v-else class="admin-empty">Chargement des fournisseurs…</p>
    <p class="muted admin-ai-provider-footnote">Le test vérifie l’accès à l’API sans lancer de génération. Le solde en argent n’est pas exposé par les clés API standard de ces fournisseurs; aucun montant n’est estimé ou inventé. GitHub est utilisé uniquement pour lire le README du dépôt associé.</p>
  </section>
</template>
