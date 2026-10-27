<script setup lang="ts">
import { computed } from 'vue';

interface PageViewRow { day: string; path: string; views: number; }
interface AnalyticsEventRow { day: string; path: string; event: string; source: string; device: string; count: number; }
const props = defineProps<{ rows: PageViewRow[]; events: AnalyticsEventRow[] }>();

const dailyTotals = computed(() => {
  const counts = new Map<string, number>();
  for (const row of props.rows) counts.set(row.day, (counts.get(row.day) || 0) + row.views);
  const dates: string[] = [];
  const today = new Date();
  const currentUtcDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date(currentUtcDay);
    date.setUTCDate(date.getUTCDate() - offset);
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates.map((day) => ({ day, views: counts.get(day) || 0 }));
});
const maximumViews = computed(() => Math.max(1, ...dailyTotals.value.map((entry) => entry.views)));
const linePoints = computed(() => dailyTotals.value.map((entry, index) => {
  const x = 32 + index * (536 / Math.max(1, dailyTotals.value.length - 1));
  const y = 178 - (entry.views / maximumViews.value) * 144;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}).join(' '));
const pathTotals = computed(() => {
  const totals = new Map<string, number>();
  for (const row of props.rows) totals.set(row.path, (totals.get(row.path) || 0) + row.views);
  return [...totals.entries()].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 6);
});
const maximumPathViews = computed(() => Math.max(1, ...pathTotals.value.map((entry) => entry.views)));
const totalViews = computed(() => props.rows.reduce((sum, row) => sum + row.views, 0));
const eventTotals = computed(() => {
  const counts = new Map<string, number>();
  for (const row of props.events) counts.set(row.event, (counts.get(row.event) || 0) + row.count);
  return [...counts.entries()].map(([event, count]) => ({ event, count })).sort((a, b) => b.count - a.count);
});
const sourceTotals = computed(() => {
  const counts = new Map<string, number>();
  for (const row of props.events) counts.set(row.source, (counts.get(row.source) || 0) + row.count);
  return [...counts.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
});
const deviceTotals = computed(() => {
  const counts = new Map<string, number>();
  for (const row of props.events) counts.set(row.device, (counts.get(row.device) || 0) + row.count);
  return [...counts.entries()].map(([device, count]) => ({ device, count })).sort((a, b) => b.count - a.count);
});
const maxEventCount = computed(() => Math.max(1, ...eventTotals.value.map(entry => entry.count)));
const eventLabel: Record<string, string> = { page_view: 'Pages vues', outbound_click: 'Clics sortants', contact_start: 'Formulaires commencés', form_submit: 'Messages acceptés' };
</script>

<template>
  <section class="admin-analytics-charts" aria-label="Graphiques des visites">
    <article class="window admin-analytics-card">
      <div class="admin-analytics-heading"><div><h2>Visites par jour</h2><p class="muted">30 derniers jours · données agrégées</p></div><strong>{{ totalViews.toLocaleString('fr-FR') }}<small>visites</small></strong></div>
      <svg class="admin-analytics-line" viewBox="0 0 600 210" role="img" aria-label="Courbe du nombre total de visites par jour">
        <line v-for="line in [34,82,130,178]" :key="line" x1="32" :y1="line" x2="568" :y2="line" />
        <polyline :points="linePoints" />
        <circle v-for="(entry,index) in dailyTotals" :key="entry.day" :cx="32+index*(536/Math.max(1,dailyTotals.length-1))" :cy="178-(entry.views/maximumViews)*144" r="2.6"><title>{{ entry.day }} : {{ entry.views }} visite(s)</title></circle>
        <text x="32" y="202">{{ dailyTotals[0]?.day.slice(5) }}</text>
        <text x="568" y="202" text-anchor="end">{{ dailyTotals.at(-1)?.day.slice(5) }}</text>
      </svg>
      <p v-if="!totalViews" class="muted">Les visites apparaîtront ici dès que des pages seront consultées.</p>
    </article>
    <article class="window admin-analytics-card">
      <div class="admin-analytics-heading"><div><h2>Pages les plus consultées</h2><p class="muted">Total sur la période mesurée</p></div></div>
      <div v-if="pathTotals.length" class="admin-analytics-bars">
        <div v-for="entry in pathTotals" :key="entry.path" class="admin-analytics-bar">
          <div><span>{{ entry.path }}</span><strong>{{ entry.views.toLocaleString('fr-FR') }}</strong></div>
          <span class="admin-analytics-bar-track"><i :style="{ width: `${entry.views / maximumPathViews * 100}%` }"></i></span>
        </div>
      </div>
      <p v-else class="muted">Aucune page mesurée pour le moment.</p>
    </article>
    <article class="window admin-analytics-card admin-analytics-events">
      <div class="admin-analytics-heading"><div><h2>Parcours agrégé</h2><p class="muted">Événements, sources et appareils · 30 jours</p></div></div>
      <div v-if="eventTotals.length" class="admin-analytics-bars">
        <div v-for="entry in eventTotals" :key="entry.event" class="admin-analytics-bar">
          <div><span>{{ eventLabel[entry.event] || entry.event }}</span><strong>{{ entry.count.toLocaleString('fr-FR') }}</strong></div>
          <span class="admin-analytics-bar-track"><i :style="{ width: `${entry.count / maxEventCount * 100}%` }"></i></span>
        </div>
      </div>
      <p v-else class="muted">Aucun événement mesuré pour le moment.</p>
      <div v-if="sourceTotals.length || deviceTotals.length" class="admin-analytics-breakdowns">
        <div><strong>Sources</strong><span v-for="entry in sourceTotals" :key="entry.source">{{ entry.source }} · {{ entry.count }}</span></div>
        <div><strong>Appareils</strong><span v-for="entry in deviceTotals" :key="entry.device">{{ entry.device }} · {{ entry.count }}</span></div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.admin-analytics-charts { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(240px, 1fr); gap: 14px; margin: 16px 0; }
.admin-analytics-events { grid-column: 1 / -1; }
.admin-analytics-card { min-width: 0; padding: 15px; }
.admin-analytics-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.admin-analytics-heading h2 { margin: 0; font-size: 14px; }
.admin-analytics-heading p { margin: 4px 0 0; font-size: 11px; }
.admin-analytics-heading > strong { color: var(--cyan); font: 18px var(--mono); text-align: right; }
.admin-analytics-heading > strong small { display: block; color: var(--muted); font-size: 9px; }
.admin-analytics-line { width: 100%; height: auto; margin-top: 12px; overflow: visible; }
.admin-analytics-line line { stroke: rgba(115, 161, 202, .18); stroke-width: 1; }
.admin-analytics-line polyline { fill: none; stroke: var(--cyan); stroke-linecap: round; stroke-linejoin: round; stroke-width: 3; }
.admin-analytics-line circle { fill: var(--cyan); }
.admin-analytics-line text { fill: var(--muted); font: 10px var(--mono); }
.admin-analytics-bars { display: grid; gap: 13px; margin-top: 20px; }
.admin-analytics-bar > div { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 5px; font: 10px var(--mono); }
.admin-analytics-bar > div span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin-analytics-bar > div strong { color: var(--cyan); }
.admin-analytics-bar-track { display: block; height: 6px; overflow: hidden; border-radius: 99px; background: rgba(85, 128, 170, .2); }
.admin-analytics-bar-track i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--cyan), var(--violet)); }
.admin-analytics-breakdowns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
.admin-analytics-breakdowns > div { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
.admin-analytics-breakdowns strong { flex-basis: 100%; font-size: 11px; }
.admin-analytics-breakdowns span { padding: 3px 7px; border: 1px solid var(--line); border-radius: 99px; color: var(--muted); font-size: 10px; }
@media (max-width: 760px) { .admin-analytics-charts { grid-template-columns: 1fr; } }
@media (max-width: 500px) { .admin-analytics-breakdowns { grid-template-columns: 1fr; } }
</style>
