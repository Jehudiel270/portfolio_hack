<script setup lang="ts">
import { computed, ref } from 'vue';
import { ImagePlus, LoaderCircle, Sparkles, UploadCloud } from 'lucide-vue-next';

const props = defineProps<{ title: string; description: string }>();
const emit = defineEmits<{ useCover: [url: string] }>();
const consent = ref(false);
const busy = ref(false);
const error = ref('');
const generatedImage = ref('');
const imageProvider = ref<'gemini'|'openai'|'stability'>('gemini');
const prompt = computed(() => [
  `Create a polished, original portfolio project cover image for: ${props.title || 'an unnamed software project'}.`,
  props.description ? `Project context: ${props.description.slice(0, 500)}` : '',
  'Make a clean professional visual, no text, no logos, no fake product screenshots, no UI text, cinematic but restrained colors, suitable for a developer portfolio.',
  'Compose for a wide 16:9 crop. Output should remain clear after center-cropping to 1200 by 675 pixels.',
].filter(Boolean).join('\n'));

function csrfHeaders() {
  const csrf = document.cookie.split('; ').find(item => item.startsWith('carrel_admin_csrf='))?.slice('carrel_admin_csrf='.length) || '';
  return { 'x-admin-csrf': csrf };
}

function errorMessage(cause: unknown) {
  if (cause && typeof cause === 'object') {
    const request = cause as { data?: { statusMessage?: unknown }; statusMessage?: unknown };
    const message = request.data?.statusMessage || request.statusMessage;
    if (typeof message === 'string') return message;
  }
  return 'La génération de couverture a échoué.';
}

async function generate() {
  error.value = '';
  generatedImage.value = '';
  if (!consent.value) {
    error.value = 'Accepte l’envoi du titre et du contexte au fournisseur d’image avant de générer.';
    return;
  }
  busy.value = true;
  try {
    const result = await $fetch<{ image: string }>('/api/admin/ai/image', {
      method: 'POST',
      body: { prompt: prompt.value, consent: consent.value, provider: imageProvider.value },
      headers: csrfHeaders(),
    });
    generatedImage.value = result.image;
  } catch (cause) {
    error.value = errorMessage(cause);
  } finally {
    busy.value = false;
  }
}

async function useGeneratedCover() {
  if (!generatedImage.value) return;
  error.value = '';
  busy.value = true;
  try {
    const image = new Image();
    image.src = generatedImage.value;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Impossible de préparer la couverture dans ce navigateur.');
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('Impossible de convertir la couverture.')), 'image/jpeg', 0.9);
    });
    const formData = new FormData();
    formData.append('file', blob, 'portfolio-ai-cover.jpg');
    formData.append('folder', 'projects');
    const uploaded = await $fetch<{ url: string }>('/api/admin/upload', {
      method: 'POST',
      body: formData,
      headers: csrfHeaders(),
    });
    emit('useCover', uploaded.url);
  } catch (cause) {
    error.value = errorMessage(cause);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="admin-ai-cover-generator">
    <div><h3><ImagePlus :size="15" /> Créer une couverture par IA</h3><p>Génère un visuel original 16:9 à partir du titre et de la description. Ce n’est pas une capture réelle du site ou du dépôt.</p></div>
    <label class="admin-gemini-provider">Fournisseur d’image
      <select v-model="imageProvider"><option value="gemini">Google Gemini / Imagen</option><option value="openai">OpenAI Images</option><option value="stability">Stability AI</option></select>
    </label>
    <label class="admin-gemini-consent"><input v-model="consent" type="checkbox"><span>J’accepte d’envoyer le titre et la description de ce projet au fournisseur sélectionné. Le fournisseur peut facturer cette génération sur la clé configurée.</span></label>
    <button class="button secondary" type="button" :disabled="busy||!consent||!title.trim()" @click="generate"><LoaderCircle v-if="busy&&!generatedImage" :size="14" class="admin-spinner" /><Sparkles v-else :size="14" />{{ busy&&!generatedImage?'Génération…':'Générer une couverture' }}</button>
    <div v-if="generatedImage" class="admin-ai-cover-preview"><img :src="generatedImage" alt="Aperçu de la couverture générée"><button class="button" type="button" :disabled="busy" @click="useGeneratedCover"><LoaderCircle v-if="busy" :size="14" class="admin-spinner" /><UploadCloud v-else :size="14" />{{ busy?'Envoi…':'Utiliser comme couverture' }}</button></div>
    <p v-if="error" class="admin-alert error" role="alert">{{ error }}</p>
  </section>
</template>
