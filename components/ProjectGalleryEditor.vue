<script setup lang="ts">
import { ref } from 'vue';
import { ArrowDown, ArrowUp, CloudUpload, GripVertical, Trash2 } from 'lucide-vue-next';
import type { ProjectMedia } from '~/composables/usePortfolioData';

const props = withDefaults(defineProps<{ modelValue: ProjectMedia[]; coverUrl?: string | null; allowUpload?: boolean }>(), { allowUpload: true });
const emit = defineEmits<{ 'update:modelValue': [value: ProjectMedia[]]; 'update:coverUrl': [url: string]; upload: [index?: number]; 'upload-files': [files: File[]] }>();
const draggedIndex = ref<number | null>(null);
const dropTargetIndex = ref<number | null>(null);

function update(index: number, field: keyof ProjectMedia, value: string | number) {
  emit('update:modelValue', props.modelValue.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
}
function remove(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index).map((item, order) => ({ ...item, sortOrder: order + 1 })));
}
function move(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= props.modelValue.length) return;
  const items = [...props.modelValue];
  [items[index], items[target]] = [items[target], items[index]];
  emit('update:modelValue', items.map((item, order) => ({ ...item, sortOrder: order + 1 })));
}
function addEmpty() {
  emit('update:modelValue', [...props.modelValue, { url: '', alt: '', caption: '', sortOrder: props.modelValue.length + 1 }]);
}
function dropAt(index: number) {
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    const items = [...props.modelValue];
    const [item] = items.splice(draggedIndex.value, 1);
    items.splice(index, 0, item);
    emit('update:modelValue', items.map((entry, order) => ({ ...entry, sortOrder: order + 1 })));
  }
  draggedIndex.value = null;
  dropTargetIndex.value = null;
}
function acceptDroppedFiles(event: DragEvent) {
  if (!props.allowUpload) return;
  const files = Array.from(event.dataTransfer?.files || []);
  if (files.length) emit('upload-files', files);
}
</script>

<template>
  <section class="gallery-editor">
    <div class="gallery-editor-heading">
      <div><strong>Captures du projet</strong><small>Dépose des images ici, ou fais glisser une capture pour la réordonner.</small><small>Format conseillé : environ 1200 × 800 px (3:2) pour des captures nettes.</small></div>
      <div class="gallery-editor-actions">
        <button class="button secondary" type="button" @click="addEmpty">Ajouter une URL</button>
        <button v-if="allowUpload" class="button secondary" type="button" @click="emit('upload')">Téléverser</button>
      </div>
    </div>
    <div v-if="allowUpload" class="gallery-dropzone" @dragover.prevent @drop.prevent="acceptDroppedFiles">
      <CloudUpload :size="20" />
      <span>Dépose tes images pour les ajouter à la galerie</span>
      <small>JPEG, PNG ou WebP · 8 Mo maximum par image</small>
    </div>
    <article v-for="(media, index) in modelValue" :key="index" :class="['gallery-editor-item', { 'is-dragging': draggedIndex===index, 'is-drop-target': dropTargetIndex===index }]" draggable="true" @dragstart="draggedIndex=index" @dragenter.prevent="dropTargetIndex=index" @dragover.prevent="dropTargetIndex=index" @drop.prevent="dropAt(index)" @dragend="draggedIndex=null;dropTargetIndex=null">
      <div v-if="media.url" class="gallery-editor-preview">
        <img :src="media.url" :alt="media.alt || `Aperçu de la capture ${index + 1}`" loading="lazy">
        <span>{{ media.caption || `Capture ${index + 1}` }}</span>
      </div>
      <div class="gallery-editor-toolbar">
        <strong><GripVertical :size="15" class="gallery-drag-handle" />Capture {{ index + 1 }}<span v-if="coverUrl === media.url" class="gallery-cover-badge"> · Couverture</span></strong>
        <div>
          <button class="button secondary" type="button" :disabled="!media.url || coverUrl === media.url" @click="emit('update:coverUrl', media.url)">Choisir la couverture</button>
          <button class="icon-button" type="button" :disabled="index===0" :aria-label="`Monter la capture ${index+1}`" @click="move(index,-1)"><ArrowUp :size="14" /></button>
          <button class="icon-button" type="button" :disabled="index===modelValue.length-1" :aria-label="`Descendre la capture ${index+1}`" @click="move(index,1)"><ArrowDown :size="14" /></button>
          <button v-if="allowUpload" class="button secondary" type="button" @click="emit('upload',index)">Remplacer l’image</button>
          <button class="icon-button danger" type="button" :aria-label="`Supprimer la capture ${index+1}`" @click="remove(index)"><Trash2 :size="14" /></button>
        </div>
      </div>
      <label class="field"><span>URL de l’image</span><input :value="media.url" type="url" required placeholder="https://…" @input="update(index,'url',($event.target as HTMLInputElement).value)"></label>
      <label class="field"><span>Texte alternatif</span><input :value="media.alt" maxlength="250" placeholder="Décris l’image pour les lecteurs d’écran" @input="update(index,'alt',($event.target as HTMLInputElement).value)"></label>
      <label class="field"><span>Légende (facultatif)</span><input :value="media.caption" maxlength="500" placeholder="Contexte de cette capture" @input="update(index,'caption',($event.target as HTMLInputElement).value)"></label>
    </article>
    <p v-if="!modelValue.length" class="muted">Aucune capture. Tu peux téléverser plusieurs images ou ajouter leurs URL.</p>
  </section>
</template>
