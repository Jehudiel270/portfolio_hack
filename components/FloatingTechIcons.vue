<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { FloatingIconSettings } from '~/composables/usePortfolioData';

const props = defineProps<{ settings: FloatingIconSettings }>();
interface FloatingIcon { id: number; name: string; icon: string; top: number; left: number; size: number; duration: number; opacity: number; rotation: number; }
const visibleIcons = ref<FloatingIcon[]>([]);
let timer = 0;
let nextId = 0;
let reducedMotionQuery: MediaQueryList | null = null;
let mobilePerformanceQuery: MediaQueryList | null = null;
const mobilePerformanceMode = ref(false);
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
    size: randomBetween(props.settings.minSize, props.settings.maxSize),
    duration: randomBetween(props.settings.minDuration, props.settings.maxDuration) / Math.max(0.5, props.settings.speed),
    opacity: props.settings.opacity / 100 * randomBetween(0.65, 1),
    rotation: randomBetween(-props.settings.maxRotation, props.settings.maxRotation),
  });
  visibleIcons.value = visibleIcons.value.slice(-props.settings.maxIcons);
}
function schedule() {
  window.clearTimeout(timer);
  if (!props.settings.enabled || !props.settings.icons.length || mobilePerformanceMode.value) {
    visibleIcons.value = [];
    return;
  }
  spawn();
  if (reducedMotionQuery?.matches) return;
  timer = window.setTimeout(schedule, randomBetween(props.settings.minSpawnIntervalMs, props.settings.maxSpawnIntervalMs) / Math.max(0.5, props.settings.speed));
}
watch(() => [
  props.settings.enabled,
  props.settings.icons,
  props.settings.maxIcons,
  props.settings.opacity,
  props.settings.speed,
  props.settings.layer,
  props.settings.minSize,
  props.settings.maxSize,
  props.settings.minDuration,
  props.settings.maxDuration,
  props.settings.minSpawnIntervalMs,
  props.settings.maxSpawnIntervalMs,
  props.settings.maxRotation,
  props.settings.floatDistance,
], schedule, { deep: true });
const layerZIndex = () => ({
  'behind-background': 0,
  'above-background': 3,
  foreground: 20,
}[props.settings.layer]);
onMounted(() => {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mobilePerformanceQuery = window.matchMedia('(max-width: 720px)');
  mobilePerformanceMode.value = mobilePerformanceQuery.matches;
  reducedMotionQuery.addEventListener('change', schedule);
  mobilePerformanceQuery.addEventListener('change', schedule);
  schedule();
});
onBeforeUnmount(() => {
  window.clearTimeout(timer);
  reducedMotionQuery?.removeEventListener('change', schedule);
  mobilePerformanceQuery?.removeEventListener('change', schedule);
});
</script>

<template>
  <div v-if="settings.enabled && !mobilePerformanceMode" class="floating-tech-icons" :style="{ '--floating-icons-z': layerZIndex() }" aria-hidden="true">
    <span v-for="item in visibleIcons" :key="item.id" class="floating-tech-icons__item" :style="{
      '--icon-top': `${item.top}%`,
      '--icon-left': `${item.left}%`,
      '--icon-size': `${item.size}px`,
      '--icon-duration': `${item.duration}s`,
      '--icon-opacity': item.opacity,
      '--icon-rotation': `${item.rotation}deg`,
      '--icon-float-distance': `${settings.floatDistance}px`,
    }">
      <TechnologyIcon :name="item.name" :icon="item.icon" :size="item.size" eager />
    </span>
  </div>
</template>

<style scoped>
.floating-tech-icons { position: fixed; inset: 0; z-index: var(--floating-icons-z, 1); overflow: hidden; pointer-events: none; }
.floating-tech-icons__item { position: absolute; top: var(--icon-top); left: var(--icon-left); width: var(--icon-size); height: var(--icon-size); opacity: var(--icon-opacity); filter: drop-shadow(0 0 10px color-mix(in srgb, var(--cyan) 24%, transparent)); animation: float-tech var(--icon-duration) ease-in-out infinite alternate; }
.floating-tech-icons__item :deep(.technology-icon), .floating-tech-icons__item :deep(.technology-icon-fallback) { width: 100% !important; height: 100% !important; object-fit: contain; }
@keyframes float-tech { to { transform: translate3d(0, calc(-1 * var(--icon-float-distance, 22px)), 0) rotate(var(--icon-rotation)); } }
@media (prefers-reduced-motion: reduce) { .floating-tech-icons__item { animation: none; } }
</style>
