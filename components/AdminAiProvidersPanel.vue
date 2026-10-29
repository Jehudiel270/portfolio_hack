<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { CheckCircle2, Eye, EyeOff, Loader2, RotateCw, Save, Trash2 } from 'lucide-vue-next';
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
type GithubAccountRow = { id: string; name: string };
const providers = ref<ProviderRow[]>([]);
const usage = ref<UsageRow[]>([]);
const githubAccounts = ref<GithubAccountRow[]>([]);
const githubAccountName = ref('');
const githubToken = ref('');
const geminiAccounts = ref<GithubAccountRow[]>([]);
const geminiAccountName = ref('');
const geminiToken = ref('');
const showGeminiKey = ref(false);
const showGithubKey = ref(false);
const showProviderKeys = reactive<Record<string, boolean>>({});
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
  const [providerResponse, usageResponse, githubAccountResponse, geminiAccountResponse] = await Promise.all([
    $fetch<{ providers: ProviderRow[] }>('/api/admin/ai/providers'),
    $fetch<UsageRow[]>('/api/admin/ai/usage'),
    $fetch<GithubAccountRow[]>('/api/admin/ai/github-accounts'),
    $fetch<GithubAccountRow[]>('/api/admin/ai/gemini-accounts'),
  ]);
  providers.value = providerResponse.providers;
  usage.value = usageResponse;
  githubAccounts.value = githubAccountResponse;
  geminiAccounts.value = geminiAccountResponse;
  for (const provider of providers.value) models[provider.id] = provider.model || provider.defaultModel;
}

async function addGithubAccount() {
  error.value = '';
  notice.value = '';
  saving.value = 'github';
  try {
    const result = await $fetch<{ accounts: GithubAccountRow[] }>('/api/admin/ai/github-accounts', {
      method: 'POST',
      body: { name: githubAccountName.value, apiKey: githubToken.value },
      headers: csrfHeaders(),
    });
    githubAccounts.value = result.accounts;
    githubAccountName.value = '';
    githubToken.value = '';
    notice.value = 'Compte GitHub enregistré et chiffré côté serveur.';
    await load();
  } catch (cause) {
    error.value = getError(cause);
  } finally {
    saving.value = '';
  }
}

async function addGeminiAccount() {
  error.value = ''; notice.value = ''; saving.value = 'gemini-accounts';
  try {
    const result = await $fetch<{ accounts: GithubAccountRow[] }>('/api/admin/ai/gemini-accounts', { method: 'POST', body: { name: geminiAccountName.value, apiKey: geminiToken.value }, headers: csrfHeaders() });
    geminiAccounts.value = result.accounts; geminiAccountName.value = ''; geminiToken.value = ''; notice.value = 'Clé Gemini ajoutée et chiffrée. Le système basculera automatiquement en cas de limite.'; await load();
  } catch (cause) { error.value = getError(cause); } finally { saving.value = ''; }
}

async function removeGeminiAccount(account: GithubAccountRow) {
  if (!confirm(`Retirer la clé Gemini « ${account.name} » ?`)) return;
  saving.value = 'gemini-accounts'; error.value = ''; notice.value = '';
  try {
    const result = await $fetch<{ accounts: GithubAccountRow[] }>(`/api/admin/ai/gemini-accounts/${account.id}`, { method: 'DELETE', headers: csrfHeaders() });
    geminiAccounts.value = result.accounts; notice.value = `Clé Gemini « ${account.name} » retirée.`; await load();
  } catch (cause) { error.value = getError(cause); } finally { saving.value = ''; }
}

async function removeGithubAccount(account: GithubAccountRow) {
  if (!confirm(`Retirer le jeton du compte « ${account.name} » ?`)) return;
  error.value = '';
  notice.value = '';
  saving.value = 'github';
  try {
    const result = await $fetch<{ accounts: GithubAccountRow[] }>(`/api/admin/ai/github-accounts/${account.id}`, {
      method: 'DELETE',
      headers: csrfHeaders(),
    });
    githubAccounts.value = result.accounts;
    notice.value = `Jeton du compte « ${account.name} » retiré.`;
    await load();
  } catch (cause) {
    error.value = getError(cause);
  } finally {
    saving.value = '';
  }
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
        <template v-if="provider.id==='gemini'">
          <div class="admin-github-accounts">
            <p class="muted">Plusieurs clés Gemini peuvent être enregistrées. Elles sont essayées dans l’ordre pour la rédaction et la génération d’images lorsqu’une limite 429 ou un refus 403 se produit.</p>
            <div v-if="geminiAccounts.length" class="admin-github-account-list">
              <div v-for="account in geminiAccounts" :key="account.id" class="admin-github-account"><span><CheckCircle2 :size="14" /> {{ account.name }}</span><button class="icon-button danger" type="button" :disabled="saving==='gemini-accounts'" :aria-label="`Retirer la clé Gemini ${account.name}`" @click="removeGeminiAccount(account)"><Trash2 :size="14" /></button></div>
            </div>
            <p v-else class="muted">Aucune clé Gemini nommée enregistrée.</p>
            <label>Nom de la clé<input v-model.trim="geminiAccountName" maxlength="60" placeholder="Ex. Gemini principal, quota secondaire"></label>
            <label>Clé API Gemini<span class="admin-secret-input"><input v-model="geminiToken" :type="showGeminiKey?'text':'password'" autocomplete="new-password" maxlength="500" placeholder="AIza…"><button class="icon-button" type="button" :aria-label="showGeminiKey?'Masquer la clé':'Afficher la clé'" @click="showGeminiKey=!showGeminiKey"><EyeOff v-if="showGeminiKey" :size="14" /><Eye v-else :size="14" /></button></span></label>
            <small class="muted">Maximum 10 clés. Les clés restent chiffrées et ne sont jamais affichées après enregistrement.</small>
            <button class="button" type="button" :disabled="saving==='gemini-accounts'||!geminiAccountName.trim()||geminiToken.trim().length<16||geminiAccounts.length>=10" @click="addGeminiAccount"><Loader2 v-if="saving==='gemini-accounts'" :size="14" class="admin-spinner" /><Save v-else :size="14" /> Ajouter la clé</button>
          </div>
          <label>Modèle Gemini<input v-model.trim="models[provider.id]" :placeholder="provider.defaultModel" maxlength="120"></label>
        </template>
        <template v-else-if="provider.id==='github'">
          <div class="admin-github-accounts">
            <p class="muted">L’assistant essaie les jetons enregistrés jusqu’à trouver un compte autorisé à lire le dépôt demandé. Les jetons restent chiffrés et ne sont jamais réaffichés.</p>
            <div v-if="githubAccounts.length" class="admin-github-account-list">
              <div v-for="account in githubAccounts" :key="account.id" class="admin-github-account">
                <span><CheckCircle2 :size="14" /> {{ account.name }}</span>
                <button class="icon-button danger" type="button" :disabled="saving==='github'" :aria-label="`Retirer le jeton de ${account.name}`" @click="removeGithubAccount(account)"><Trash2 :size="14" /></button>
              </div>
            </div>
            <p v-else class="muted">Aucun compte GitHub enregistré.</p>
            <label>Nom du compte
              <input v-model.trim="githubAccountName" maxlength="60" placeholder="Ex. Personnel, client A, organisation">
            </label>
            <label>Jeton GitHub avec accès en lecture seule
              <span class="admin-secret-input"><input v-model="githubToken" :type="showGithubKey?'text':'password'" autocomplete="new-password" maxlength="500" placeholder="Fine-grained token ou token classique"><button class="icon-button" type="button" :aria-label="showGithubKey?'Masquer le jeton':'Afficher le jeton'" @click="showGithubKey=!showGithubKey"><EyeOff v-if="showGithubKey" :size="14" /><Eye v-else :size="14" /></button></span>
            </label>
            <small class="muted">Maximum 25 jetons. Accorde uniquement l’accès « Contents: Read-only » aux dépôts nécessaires. Les tokens expirables sont préférables.</small>
            <button class="button" type="button" :disabled="saving==='github'||!githubAccountName.trim()||githubToken.trim().length<20||githubAccounts.length>=25" @click="addGithubAccount"><Loader2 v-if="saving==='github'" :size="14" class="admin-spinner" /><Save v-else :size="14" /> Ajouter le compte</button>
          </div>
        </template>
        <template v-else>
        <label>Modèle / API
          <input v-model.trim="models[provider.id]" :disabled="provider.id==='screenshotone'" :placeholder="provider.defaultModel" maxlength="120">
        </label>
        <label>Clé API
          <span class="admin-secret-input"><input v-model="keys[provider.id]" :type="showProviderKeys[provider.id]?'text':'password'" autocomplete="new-password" :placeholder="provider.configured ? provider.managedInDashboard ? 'Laisser vide pour conserver la clé' : 'Clé d’environnement détectée · optionnel pour la chiffrer en base' : 'Coller la clé secrète ici'" maxlength="500"><button class="icon-button" type="button" :aria-label="showProviderKeys[provider.id]?'Masquer la clé':'Afficher la clé'" @click="showProviderKeys[provider.id]=!showProviderKeys[provider.id]"><EyeOff v-if="showProviderKeys[provider.id]" :size="14" /><Eye v-else :size="14" /></button></span>
        </label>
        </template>
        <small class="muted">{{ provider.balance }}</small>
        <small v-if="provider.id !== 'github'&&provider.id!=='screenshotone'&&provider.configured" class="muted">Usage local · {{ usageFor(provider.id).requests }} requêtes · {{ usageFor(provider.id).input }} jetons entrée / {{ usageFor(provider.id).output }} sortie (30 jours). Le coût exact est calculé par le fournisseur.</small>
        <small v-if="provider.id==='screenshotone'&&provider.configured" class="muted">Usage local · {{ usageFor(provider.id).requests }} captures sur les 30 derniers jours.</small>
        <small v-if="testResults[provider.id]" class="admin-ai-provider-test" role="status"><CheckCircle2 :size="14" /> {{ testResults[provider.id] }}</small>
        <div class="admin-ai-provider-actions">
          <button v-if="provider.id!=='github'" class="button" type="button" :disabled="saving===provider.id" @click="save(provider)"><Loader2 v-if="saving===provider.id" :size="14" class="admin-spinner" /><Save v-else :size="14" /> Enregistrer</button>
          <button v-if="provider.id!=='screenshotone'" class="button secondary" type="button" :disabled="!provider.configured||testing===provider.id" @click="test(provider)"><Loader2 v-if="testing===provider.id" :size="14" class="admin-spinner" /><CheckCircle2 v-else :size="14" /> Tester</button>
          <button v-if="provider.managedInDashboard&&provider.id!=='github'" class="icon-button danger" type="button" :disabled="saving===provider.id" :aria-label="`Retirer ${provider.label}`" @click="remove(provider)"><Trash2 :size="14" /></button>
        </div>
      </article>
    </div>
    <p v-else class="admin-empty">Chargement des fournisseurs…</p>
    <p class="muted admin-ai-provider-footnote">Le test vérifie l’accès à l’API sans lancer de génération; ScreenshotOne n’est validé qu’au moment d’une capture consentie. Le solde monétaire n’est pas exposé par les clés API standard; aucune valeur n’est inventée. GitHub sert uniquement à lire le README du dépôt associé.</p>
  </section>
</template>
