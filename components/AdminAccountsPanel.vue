<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Loader2, Plus, Save, ShieldCheck, UserRoundX } from 'lucide-vue-next';
import { ADMIN_PERMISSION_GROUPS, type AdminPermissions } from '~/shared/adminPermissions';

const emit = defineEmits<{ 'display-name-updated': [] }>();

type AdminAccount = {
  id: number;
  email: string;
  displayName: string;
  role: string;
  active: boolean;
  permissions: AdminPermissions;
  totpEnabled: boolean;
  createdAt: string;
};

const accounts = ref<AdminAccount[]>([]);
const drafts = reactive<Record<number, AdminPermissions>>({});
const passwordResets = reactive<Record<number, string>>({});
const displayName = ref('');
const email = ref('');
const password = ref('');
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const notice = ref('');

function csrfHeaders() {
  return {
    'x-admin-csrf': document.cookie.split('; ').find((cookie) => cookie.startsWith('carrel_admin_csrf='))?.slice('carrel_admin_csrf='.length) || '',
  };
}

function copyPermissions(account: AdminAccount) {
  drafts[account.id] = { ...account.permissions };
}

function setGroupPermissions(accountId: number, actions: typeof ADMIN_PERMISSION_GROUPS[number]['actions'], granted: boolean) {
  for (const action of actions) drafts[accountId]![action.key] = granted;
}

function setAllPermissions(accountId: number, granted: boolean) {
  for (const group of ADMIN_PERMISSION_GROUPS) {
    setGroupPermissions(accountId, group.actions, granted);
  }
}

async function loadAccounts() {
  loading.value = true;
  error.value = '';
  try {
    accounts.value = await $fetch<AdminAccount[]>('/api/admin/accounts');
    for (const account of accounts.value) copyPermissions(account);
  } catch (cause: unknown) {
    error.value = requestErrorMessage(cause, 'Impossible de charger les comptes administrateurs.');
  } finally {
    loading.value = false;
  }
}

function requestErrorMessage(value: unknown, fallback: string) {
  if (value && typeof value === 'object') {
    const error = value as { data?: { statusMessage?: unknown }; statusMessage?: unknown };
    if (typeof error.data?.statusMessage === 'string') return error.data.statusMessage;
    if (typeof error.statusMessage === 'string') return error.statusMessage;
  }
  return fallback;
}

async function createAccount() {
  saving.value = true;
  error.value = '';
  notice.value = '';
  try {
    await $fetch('/api/admin/accounts', {
      method: 'POST',
      body: { email: email.value, displayName: displayName.value, password: password.value, permissions: {} },
      headers: csrfHeaders(),
    });
    displayName.value = '';
    email.value = '';
    password.value = '';
    notice.value = 'Compte créé sans accès aux sections. Attribue ses droits avant de transmettre ses identifiants.';
    await loadAccounts();
  } catch (cause: unknown) {
    error.value = requestErrorMessage(cause, 'La création du compte a échoué.');
  } finally {
    saving.value = false;
  }
}

async function saveDisplayName(account: AdminAccount) {
  saving.value = true;
  error.value = '';
  notice.value = '';
  try {
    await $fetch(`/api/admin/accounts/${account.id}`, {
      method: 'PATCH',
      body: { displayName: account.displayName },
      headers: csrfHeaders(),
    });
    notice.value = `Nom affiché mis à jour pour ${account.email}.`;
    await loadAccounts();
    emit('display-name-updated');
  } catch (cause: unknown) {
    error.value = requestErrorMessage(cause, 'La mise à jour du nom affiché a échoué.');
  } finally {
    saving.value = false;
  }
}

async function savePermissions(account: AdminAccount) {
  saving.value = true;
  error.value = '';
  notice.value = '';
  try {
    await $fetch(`/api/admin/accounts/${account.id}`, {
      method: 'PATCH',
      body: { permissions: drafts[account.id] },
      headers: csrfHeaders(),
    });
    notice.value = `Droits mis à jour pour ${account.email}.`;
    await loadAccounts();
  } catch (cause: unknown) {
    error.value = requestErrorMessage(cause, 'La mise à jour des droits a échoué.');
  } finally {
    saving.value = false;
  }
}

async function setActive(account: AdminAccount, active: boolean) {
  saving.value = true;
  error.value = '';
  notice.value = '';
  try {
    await $fetch(`/api/admin/accounts/${account.id}`, {
      method: 'PATCH',
      body: { active },
      headers: csrfHeaders(),
    });
    notice.value = active ? 'Compte réactivé.' : 'Compte désactivé. Ses sessions ne peuvent plus accéder à l’admin.';
    await loadAccounts();
  } catch (cause: unknown) {
    error.value = requestErrorMessage(cause, 'Le changement d’état du compte a échoué.');
  } finally {
    saving.value = false;
  }
}

async function resetPassword(account: AdminAccount) {
  const nextPassword = passwordResets[account.id] || '';
  if (nextPassword.length < 12) {
    error.value = 'Le nouveau mot de passe doit contenir au moins 12 caractères.';
    return;
  }
  saving.value = true;
  error.value = '';
  notice.value = '';
  try {
    await $fetch(`/api/admin/accounts/${account.id}`, {
      method: 'PATCH',
      body: { password: nextPassword },
      headers: csrfHeaders(),
    });
    passwordResets[account.id] = '';
    notice.value = `Mot de passe changé pour ${account.email}. Ses sessions existantes sont révoquées.`;
  } catch (cause: unknown) {
    error.value = requestErrorMessage(cause, 'Le changement de mot de passe a échoué.');
  } finally {
    saving.value = false;
  }
}

async function resetMfa(account: AdminAccount) {
  if (!window.confirm(`Réinitialiser la double authentification de ${account.email} ? Sa prochaine connexion exigera une nouvelle inscription TOTP.`)) return;
  saving.value = true;
  error.value = '';
  notice.value = '';
  try {
    await $fetch(`/api/admin/accounts/${account.id}`, {
      method: 'PATCH',
      body: { resetMfa: true },
      headers: csrfHeaders(),
    });
    notice.value = `La 2FA de ${account.email} est réinitialisée ; ses sessions sont révoquées.`;
    await loadAccounts();
  } catch (cause: unknown) {
    error.value = requestErrorMessage(cause, 'La réinitialisation de la 2FA a échoué.');
  } finally {
    saving.value = false;
  }
}

onMounted(loadAccounts);
</script>

<template>
  <section class="accounts-panel">
    <div class="accounts-intro">
      <ShieldCheck :size="20" />
      <div>
        <h2>Comptes &amp; permissions</h2>
        <p>Un seul super-administrateur. Les autres comptes démarrent sans droit ; active uniquement les actions nécessaires.</p>
      </div>
    </div>

    <p v-if="error" class="account-message error" role="alert">{{ error }}</p>
    <p v-if="notice" class="account-message success" role="status">{{ notice }}</p>

    <form class="account-create" @submit.prevent="createAccount">
      <h3>Créer un compte administrateur</h3>
      <div class="account-create-fields">
        <label>Nom affiché
          <input v-model.trim="displayName" required maxlength="120" autocomplete="off" placeholder="Prénom et nom">
        </label>
        <label>Adresse e-mail
          <input v-model.trim="email" type="email" required maxlength="320" autocomplete="off" placeholder="collaborateur@exemple.com">
        </label>
        <label>Mot de passe initial (12 caractères minimum)
          <input v-model="password" type="password" required minlength="12" maxlength="256" autocomplete="new-password">
        </label>
        <button class="button" type="submit" :disabled="saving">
          <Loader2 v-if="saving" :size="15" class="spin" />
          <Plus v-else :size="15" />
          Créer sans droits
        </button>
      </div>
      <small>Le mot de passe n’est jamais affiché après la création ; seul son hash est stocké. Le nouveau compte devra configurer sa propre double authentification à la première connexion.</small>
    </form>

    <div v-if="loading" class="account-loading"><Loader2 :size="16" class="spin" /> Chargement des comptes…</div>
    <div v-else class="account-list">
      <article v-for="account in accounts" :key="account.id" class="account-card">
        <details class="account-details">
          <summary class="account-card-summary">
            <span class="account-summary-copy">
              <strong>{{ account.displayName || account.email }}</strong>
              <small>{{ account.email }} · {{ account.role === 'super_admin' ? 'Super-administrateur unique' : account.active ? 'Administrateur' : 'Compte désactivé' }} · {{ account.totpEnabled ? '2FA activée' : '2FA à configurer' }}</small>
            </span>
            <span class="account-expand-label">Gérer le compte</span>
          </summary>
          <div class="account-details-content">
            <div class="account-display-name">
              <label>Nom affiché sur le tableau de bord
                <input v-model.trim="account.displayName" required maxlength="120" autocomplete="off">
              </label>
              <button class="button secondary" type="button" :disabled="saving||!account.displayName.trim()" @click="saveDisplayName(account)">
                <Loader2 v-if="saving" :size="14" class="spin" />
                <Save v-else :size="14" /> Enregistrer le nom
              </button>
            </div>
            <header class="account-card-head">
              <button
                v-if="account.role !== 'super_admin'"
                class="button secondary"
                type="button"
                :disabled="saving"
                @click="setActive(account, !account.active)"
              >
                <UserRoundX :size="14" /> {{ account.active ? 'Désactiver' : 'Réactiver' }}
              </button>
            </header>

            <p v-if="account.role === 'super_admin'" class="owner-note">Les droits du super-administrateur sont fixes et ne peuvent pas être modifiés ici.</p>
            <div v-else class="permission-groups">
              <div class="account-security-actions">
                <label>Nouveau mot de passe
                  <input v-model="passwordResets[account.id]" type="password" minlength="12" maxlength="256" autocomplete="new-password" placeholder="12 caractères minimum">
                </label>
                <button class="button secondary" type="button" :disabled="saving" @click="resetPassword(account)">Changer le mot de passe</button>
                <button class="button secondary" type="button" :disabled="saving||!account.totpEnabled" @click="resetMfa(account)">Réinitialiser la 2FA</button>
              </div>
              <div class="permission-bulk-actions" aria-label="Actions globales sur les permissions">
                <strong>Permissions</strong>
                <button class="button secondary" type="button" :disabled="saving" @click="setAllPermissions(account.id, true)">Tout accorder</button>
                <button class="button secondary" type="button" :disabled="saving" @click="setAllPermissions(account.id, false)">Tout retirer</button>
              </div>
              <details v-for="group in ADMIN_PERMISSION_GROUPS" :key="group.id" class="permission-group">
                <summary>{{ group.label }}</summary>
                <div class="permission-group-actions">
                  <button class="button secondary" type="button" :disabled="saving" @click="setGroupPermissions(account.id, group.actions, true)">Tout accorder</button>
                  <button class="button secondary" type="button" :disabled="saving" @click="setGroupPermissions(account.id, group.actions, false)">Tout retirer</button>
                </div>
                <div class="permission-options">
                  <label v-for="action in group.actions" :key="action.key">
                    <input v-model="drafts[account.id]![action.key]" type="checkbox">
                    <span>{{ action.label }}</span>
                  </label>
                </div>
              </details>
              <button class="button" type="button" :disabled="saving" @click="savePermissions(account)">
                <Loader2 v-if="saving" :size="14" class="spin" />
                <Save v-else :size="14" /> Enregistrer les permissions
              </button>
            </div>
          </div>
        </details>
      </article>
      <p v-if="!accounts.length" class="account-empty">Aucun compte trouvé.</p>
    </div>
  </section>
</template>

<style scoped>
.accounts-panel{display:grid;gap:18px}.accounts-intro{display:flex;align-items:flex-start;gap:12px;color:var(--cyan)}.accounts-intro h2,.account-create h3{margin:0;color:var(--text)}.accounts-intro p,.account-card-head p,.owner-note{margin:5px 0 0;color:var(--muted)}.account-create,.account-card{padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--surface,rgba(255,255,255,.035))}.account-create-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr)) auto;gap:12px;align-items:end;margin:14px 0 8px}.account-create label,.account-security-actions label,.account-display-name label{display:grid;gap:6px;color:var(--muted);font-size:.88rem}.account-create input,.account-security-actions input,.account-display-name input{min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--background,transparent);color:var(--text)}.account-create small{color:var(--muted)}.account-list{display:grid;gap:14px}.account-card-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.account-card-head strong{overflow-wrap:anywhere}.account-display-name{display:flex;align-items:end;gap:10px;margin-bottom:16px}.account-display-name label{flex:1;min-width:0}.permission-groups{display:grid;gap:8px;margin-top:16px}.account-security-actions,.permission-bulk-actions,.permission-group-actions{display:flex;align-items:end;flex-wrap:wrap;gap:10px}.permission-bulk-actions{align-items:center;padding:12px;border:1px solid var(--line);border-radius:9px}.permission-bulk-actions strong{margin-right:auto;color:var(--text)}.permission-group{border:1px solid var(--line);border-radius:9px;padding:10px 12px}.permission-group summary{cursor:pointer;font-weight:600}.permission-group-actions{align-items:center;padding-top:10px}.permission-group-actions .button,.permission-bulk-actions .button{padding:6px 10px;font-size:.82rem}.permission-options{display:flex;flex-wrap:wrap;gap:10px 18px;padding-top:12px}.permission-options label{display:flex;align-items:center;gap:7px;color:var(--muted);font-size:.88rem}.owner-note{padding:12px;border-radius:8px;background:rgba(0,210,255,.07)}.account-message{padding:12px;border-radius:9px}.account-message.error{color:#ffb5bf;background:rgba(255,70,90,.1)}.account-message.success{color:#9df0c2;background:rgba(60,210,130,.1)}.account-loading,.account-empty{display:flex;align-items:center;gap:8px;color:var(--muted)}.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:760px){.account-create-fields{grid-template-columns:1fr}.account-card-head{align-items:flex-start;flex-direction:column}.account-display-name{align-items:stretch;flex-direction:column}.permission-bulk-actions strong{width:100%}}
.account-card{padding:0}.account-card-summary{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:16px;cursor:pointer;list-style:none}.account-card-summary::-webkit-details-marker{display:none}.account-summary-copy{display:grid;min-width:0;gap:4px}.account-summary-copy strong{overflow-wrap:anywhere;color:var(--text)}.account-summary-copy small,.account-expand-label{color:var(--muted)}.account-expand-label{display:flex;align-items:center;gap:8px;flex:none}.account-expand-label::after{content:'+';color:var(--cyan);font-weight:700}.account-details[open] .account-expand-label::after{content:'-'} .account-details-content{padding:0 16px 16px}.account-card-head{justify-content:flex-end}
</style>
