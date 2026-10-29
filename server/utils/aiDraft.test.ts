import assert from 'node:assert/strict';
import test from 'node:test';
import { describeDraftValidationIssues, normalizeGeneratedDraft } from './aiDraft';

test('project AI drafts normalize common text-list and nullable metric output', () => {
  const draft = normalizeGeneratedDraft('projects', {
    tags: 'Nuxt, TypeScript',
    categories: 'Front-end\nE-commerce',
    responsibilities: 'Built the storefront\nIntegrated checkout',
    metrics: [{ label: 'Routes', value: '4', context: null, unit: null, period: null, source: null, evidenceUrl: null }],
  });

  assert.deepEqual(draft, {
    tags: ['Nuxt', 'TypeScript'],
    categories: ['Front-end', 'E-commerce'],
    responsibilities: ['Built the storefront', 'Integrated checkout'],
    metrics: [{ label: 'Routes', value: '4', evidenceUrl: null }],
  });
});

test('project AI validation problems identify the rejected field paths', () => {
  assert.deepEqual(describeDraftValidationIssues([
    { path: ['tags', 0], message: 'La technologie dépasse la longueur maximale.' },
    { path: ['metrics', 0, 'value'], message: 'Une valeur est requise.' },
  ]), [
    'tags.0 : La technologie dépasse la longueur maximale.',
    'metrics.0.value : Une valeur est requise.',
  ]);
});
