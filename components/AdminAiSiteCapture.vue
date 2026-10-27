<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { Camera, LoaderCircle, UploadCloud } from 'lucide-vue-next';

const props = defineProps<{ projectUrl: string; projectTitle: string; galleryCount: number }>();
const emit = defineEmits<{ useCapture: [url: string] }>();
type CaptureMode = 'desktop' | 'mobile' | 'fullpage';

const consent = ref(false);
const mode = ref<CaptureMode>('desktop');
const busy = ref(false);
const error = ref('');
const capturedImage = ref('');
const capturedBlob = ref<Blob | null>(null);
const capturedFromUrl = ref('');

function csrfHeaders() {
  const csrf = document.cookie.split('; ').find(item => item.startsWith('carrel_admin_csrf='))?.slice('carrel_admin_csrf='.length) || '';
  return { 'x-admin-csrf': csrf };
}

function clearCapture() {
  if (capturedImage.value) URL.revokeObjectURL(capturedImage.value);
  capturedImage.value = '';
  capturedBlob.value = null;
  capturedFromUrl.value = '';
}

watch(() => props.projectUrl, () => {
  clearCapture();
  consent.value = false;
  error.value = '';
});
onBeforeUnmount(clearCapture);

async function responseError(response: Response) {
  const body = await response.text();
  try {
    const payload = JSON.parse(body) as { statusMessage?: unknown; message?: unknown };
    const message = payload.statusMessage || payload.message;
    if (typeof message === 'string') return message;
  } catch {
    return `La capture a échoué (HTTP ${response.status}).`;
  }
  return `La capture a échoué (HTTP ${response.status}).`;
}

function errorMessage(cause: unknown) {
  if (cause && typeof cause === 'object') {
    const request = cause as { data?: { statusMessage?: unknown }; statusMessage?: unknown };
    const message = request.data?.statusMessage || request.statusMessage;
    if (typeof message === 'string') return message;
  }
  if (cause instanceof Error && cause.message) return cause.message;
  return 'La capture du site a échoué.';
}

async function capture() {
  error.value = '';
  clearCapture();
  if (!consent.value) {
    error.value = 'Accepte l’envoi de l’URL publique à ScreenshotOne avant de lancer une capture.';
    return;
  }
  if (!props.projectUrl.trim()) {
    error.value = 'Renseigne d’abord l’URL de démonstration HTTPS du projet.';
    return;
  }
  busy.value = true;
  try {
    const response = await fetch('/api/admin/ai/capture', {
      method: 'POST',
      headers: { ...csrfHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ url: props.projectUrl.trim(), mode: mode.value, consent: consent.value }),
    });
    if (!response.ok) throw new Error(await responseError(response));
    if (!response.headers.get('content-type')?.toLowerCase().startsWith('image/jpeg')) {
      throw new Error('Le serveur n’a pas retourné une image JPEG exploitable.');
    }
    const blob = await response.blob();
    if (!blob.size || blob.size > 4 * 1024 * 1024) throw new Error('La capture est vide ou dépasse la limite de 4 Mo.');
    capturedBlob.value = blob;
    capturedImage.value = URL.createObjectURL(blob);
    capturedFromUrl.value = props.projectUrl.trim();
  } catch (cause) {
    error.value = errorMessage(cause);
  } finally {
    busy.value = false;
  }
}

async function addToGallery() {
  if (!capturedBlob.value) return;
  error.value = '';
  if (props.galleryCount >= 20) {
    error.value = 'La galerie contient déjà 20 images. Retire-en une avant d’ajouter cette capture.';
    return;
  }
  busy.value = true;
  try {
    const formData = new FormData();
    formData.append('file', capturedBlob.value, 'project-site-capture.jpg');
    formData.append('folder', 'projects');
    const uploaded = await $fetch<{ url: string }>('/api/admin/upload', {
      method: 'POST',
      body: formData,
      headers: csrfHeaders(),
    });
    emit('useCapture', uploaded.url);
    clearCapture();
  } catch (cause) {
    error.value = errorMessage(cause);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="admin-ai-site-capture">
    <div>
      <h3><Camera :size="15" /> Capturer le vrai site du projet</h3>
      <p>Crée une capture réelle de l’URL de démonstration, pas une image générée. La capture sera prévisualisée puis envoyée à Cloudinary uniquement si tu l’ajoutes à la galerie.</p>
    </div>
    <label class="admin-gemini-consent"><input v-model="consent" type="checkbox"><span>J’accepte d’envoyer l’URL publique du projet à ScreenshotOne. Le service visitera la page sans mes cookies de connexion. Une capture peut utiliser le quota de la clé configurée.</span></label>
    <small v-if="!projectUrl.trim()" class="muted">Renseigne d’abord l’URL de démonstration HTTPS dans les champs de la fiche.</small>
    <div class="admin-ai-site-capture-controls">
      <label>Format de capture
        <select v-model="mode">
          <option value="desktop">Bureau · 1440 × 900</option>
          <option value="mobile">Mobile · 390 × 844</option>
          <option value="fullpage">Page entière · bureau</option>
        </select>
      </label>
      <button class="button secondary" type="button" :disabled="busy||!consent||!projectUrl.trim()||galleryCount>=20" @click="capture"><LoaderCircle v-if="busy&&!capturedImage" :size="14" class="admin-spinner" /><Camera v-else :size="14" />{{ busy&&!capturedImage?'Capture…':'Capturer le site' }}</button>
    </div>
    <small v-if="galleryCount>=20" class="muted">Limite de 20 images atteinte. Retire une image pour pouvoir ajouter une capture.</small>
    <div v-if="capturedImage" class="admin-ai-site-capture-preview">
      <img :src="capturedImage" :alt="`Aperçu de la capture réelle de ${projectTitle||'ce projet'}`">
      <small>Source capturée : {{ capturedFromUrl }}</small>
      <button class="button" type="button" :disabled="busy" @click="addToGallery"><LoaderCircle v-if="busy" :size="14" class="admin-spinner" /><UploadCloud v-else :size="14" />{{ busy?'Envoi…':'Ajouter à la galerie' }}</button>
    </div>
    <p v-if="error" class="admin-alert error" role="alert">{{ error }}</p>
  </section>
</template>
