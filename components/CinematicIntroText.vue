<script setup lang="ts">
import type { CinematicWord } from '~/composables/useCinematicIntro';

/**
 * Rend le texte de l'intro mot par mot, caractère par caractère (graphèmes Unicode).
 * Toutes les couches (principale, fantômes RVB, tranches) utilisent EXACTEMENT ce balisage, avec
 * le même crénage désactivé : elles se superposent donc au pixel près, même quand le nom passe sur deux lignes.
 */
defineProps<{ words: CinematicWord[]; animated?: boolean }>();
</script>

<template>
  <span class="cin-text"><template v-for="(word, wordIndex) in words" :key="wordIndex"><span class="cin-word"><span
    v-for="char in word.chars"
    :key="char.index"
    class="cin-char"
    :data-ci="animated ? char.index : undefined"
    :data-c="animated ? char.ch : undefined"
    :style="animated ? { animationDelay: `${char.delayMs}ms` } : undefined"
  >{{ char.ch }}</span></span>{{ wordIndex < words.length - 1 ? ' ' : '' }}</template></span>
</template>
