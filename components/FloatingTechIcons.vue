<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { FloatingIconSettings } from '~/composables/usePortfolioData';

const props = defineProps<{ settings: FloatingIconSettings }>();
interface FloatingIcon { id: number; name: string; icon: string; top: number; left: number; size: number; duration: number; opacity: number; rotation: number; }
const visibleIcons = ref<FloatingIcon[]>([]);
let timer = 0;
let nextId = 0;
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

function spawn() {
  const available = props.settings.icons;
  if (!props.settings.enabled || !available.length) return;
  const chosen = available[Math.floor(Math.random() * available.length)];
  if (!chosen) return;
  visibleIcons.value.push({
    id: nextId++,
    name: chosen.name,
    icon: chosen.icon,
    top: randomBetween(8, 88),
    left: randomBetween(5, 91),
    size: randomBetween(32, 72),
    duration: randomBetween(5, 11) / Math.max(0.5, props.settings.speed),
    opacity: props.settings.opacity / 100 * randomBetween(0.65, 1),
    rotation: randomBetween(-18, 18),
  });
  visibleIcons.value = visibleIcons.value.slice(-props.settings.maxIcons);
}
function schedule() {
  window.clearTimeout(timer);
  if (!props.settings.enabled || !props.settings.icons.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    visibleIcons.value = [];
    return;
  }
  spawn();
  timer = window.setTimeout(schedule, randomBetween(1400, 2600) / Math.max(0.5, props.settings.speed));
}
watch(() => [props.settings.enabled, props.settings.icons, props.settings.maxIcons, props.settings.opacity, props.settings.speed], schedule, { deep: true });
onMounted(schedule);
onBeforeUnmount(() => window.clearTimeout(timer));
</script>

<template>
  <div v-if="settings.enabled" class="floating-tech-icons" aria-hidden="true">
    <span v-for="item in visibleIcons" :key="item.id" class="floating-tech-icons__item" :style="{
      '--icon-top': `${item.top}%`,
      '--icon-left': `${item.left}%`,
      '--icon-size': `${item.size}px`,
      '--icon-duration': `${item.duration}s`,
      '--icon-opacity': item.opacity,
      '--icon-rotation': `${item.rotation}deg`,
    }">
      <TechnologyIcon :name="item.name" :icon="item.icon" :size="item.size" />
    </span>
  </div>
</template>

<style scoped>
.floating-tech-icons { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.floating-tech-icons__item { position: absolute; top: var(--icon-top); left: var(--icon-left); width: var(--icon-size); height: var(--icon-size); opacity: var(--icon-opacity); filter: drop-shadow(0 0 10px color-mix(in srgb, var(--cyan) 24%, transparent)); animation: float-tech var(--icon-duration) ease-in-out infinite alternate; }
.floating-tech-icons__item :deep(.technology-icon), .floating-tech-icons__item :deep(.technology-icon-fallback) { width: 100% !important; height: 100% !important; object-fit: contain; }
@keyframes float-tech { to { transform: translate3d(0, -22px, 0) rotate(var(--icon-rotation)); } }
@media (prefers-reduced-motion: reduce) { .floating-tech-icons__item { animation: none; } }
</style>
