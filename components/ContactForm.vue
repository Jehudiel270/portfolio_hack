<script setup lang="ts">
import { ref } from 'vue';
import { Send } from 'lucide-vue-next';

const contact = ref({ name: '', email: '', subject: '', message: '' });
const website = ref('');
const sending = ref(false);
const formStatus = ref('');
const formError = ref(false);

async function sendMessage() {
  sending.value = true;
  formStatus.value = '';
  formError.value = false;

  try {
    const result = await $fetch<{ message: string }>('/api/contact', {
      method: 'POST',
      body: { ...contact.value, website: website.value },
    });
    formStatus.value = result.message;
    if (import.meta.client) window.dispatchEvent(new CustomEvent('portfolio-contact', { detail: 'success' }));
    contact.value = { name: '', email: '', subject: '', message: '' };
  } catch (error: unknown) {
    formError.value = true;
    if (error && typeof error === 'object') {
      const requestError = error as {
        data?: { statusMessage?: string; message?: string };
      };
      formStatus.value = requestError.data?.statusMessage
        || requestError.data?.message
        || 'Le service de contact est momentanément indisponible. Réessaie plus tard.';
    } else {
      formStatus.value = 'Le service de contact est momentanément indisponible. Réessaie plus tard.';
    }
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <form class="window contact-card contact-form" @submit.prevent="sendMessage">
    <div class="contact-honeypot" aria-hidden="true"><label for="contact-website">Site web</label><input id="contact-website" v-model="website" tabindex="-1" autocomplete="off"></div>
    <div class="field">
      <label for="contact-name">Nom</label>
      <input id="contact-name" v-model="contact.name" required maxlength="120" autocomplete="name" placeholder="Ton nom">
    </div>
    <div class="field">
      <label for="contact-email">Adresse e-mail</label>
      <input id="contact-email" v-model="contact.email" required type="email" maxlength="320" autocomplete="email" placeholder="toi@exemple.com">
    </div>
    <div class="field full">
      <label for="contact-subject">Sujet</label>
      <input id="contact-subject" v-model="contact.subject" maxlength="180" placeholder="Objet du message">
    </div>
    <div class="field full">
      <label for="contact-message">Message</label>
      <textarea id="contact-message" v-model="contact.message" required minlength="10" maxlength="6000" placeholder="Dis-moi ce que tu as en tête..."></textarea>
    </div>
    <div class="field full contact-submit-row">
      <span :class="['form-status', { muted: !formError }]" role="status">{{ sending ? 'Transmission en cours…' : formStatus }}</span>
      <button class="button" type="submit" :disabled="sending"><Send :size="15" /> Envoyer</button>
    </div>
  </form>
</template>
