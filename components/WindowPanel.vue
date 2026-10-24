<script setup lang="ts">
import { Minus, Square, X } from 'lucide-vue-next';
defineProps<{ title: string; class?: string; icon?: string }>();
</script>
<template>
  <section :class="['window', $props.class]">
    <div class="window-bar"><div class="window-title"><span class="prompt">&gt;_</span><span>{{ title }}</span></div><div class="window-controls" aria-hidden="true"><i></i><i></i><i></i></div></div>
    <div class="window-inner"><slot /></div>
  </section>
</template>
