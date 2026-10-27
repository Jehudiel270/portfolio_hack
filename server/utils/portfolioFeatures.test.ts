import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterAiTools, parseAiUseCasesInput } from '../../composables/aiFilters';
import { parseProjectMetricsJson, parseSkillImportJson } from '../../composables/adminJsonImports';
import { filterProjects } from '../../composables/projectFilters';
import type { Technology } from '../../composables/usePortfolioData';
import { contactInputSchema } from './contactValidation';
import { floatingIconSettingsSchema } from './floatingIconSettings';

describe('floating icon settings validation', () => {
  const legacySettings = {
    enabled: false,
    maxIcons: 8,
    opacity: 20,
    speed: 1,
    layer: 'above-background',
    icons: [],
  };

  it('fills in the new animation controls for previously saved settings', () => {
    const parsed = floatingIconSettingsSchema.safeParse(legacySettings);
    assert.equal(parsed.success, true);
    if (!parsed.success) return;
    assert.equal(parsed.data.minSize, 32);
    assert.equal(parsed.data.maxSize, 72);
    assert.equal(parsed.data.minDuration, 5);
    assert.equal(parsed.data.maxDuration, 11);
    assert.equal(parsed.data.minSpawnIntervalMs, 1400);
    assert.equal(parsed.data.maxSpawnIntervalMs, 2600);
  });

  it('rejects reversed minimum and maximum animation settings', () => {
    assert.equal(floatingIconSettingsSchema.safeParse({ ...legacySettings, minSize: 90, maxSize: 70 }).success, false);
    assert.equal(floatingIconSettingsSchema.safeParse({ ...legacySettings, minDuration: 12, maxDuration: 5 }).success, false);
    assert.equal(floatingIconSettingsSchema.safeParse({ ...legacySettings, minSpawnIntervalMs: 3000, maxSpawnIntervalMs: 2000 }).success, false);
  });
});

describe('public portfolio filters', () => {
  const projects = [
    { title: 'Boutique', slug: 'boutique', description: 'Commerce', tags: ['Nuxt'], year: '2025', projectType: 'E-commerce' },
    { title: 'Portfolio', slug: 'portfolio', description: 'Site personnel', tags: ['Vue'], year: '2024', projectType: 'Web' },
  ] as never[];

  it('combines text, technology, year, and type filters', () => {
    assert.equal(filterProjects(projects as never, { query: 'boutique', technology: 'Nuxt', year: '2025', type: 'E-commerce' }).length, 1);
    assert.equal(filterProjects(projects as never, { query: '', technology: 'Vue', year: '2025', type: '' }).length, 0);
  });

  it('treats legacy projects without a type as Web', () => {
    const legacy = [{ title: 'Ancien site', slug: 'ancien-site', description: '', tags: [], year: null }] as never[];
    assert.equal(filterProjects(legacy as never, { query: '', technology: '', year: '', type: 'Web' }).length, 1);
  });
});

describe('public AI filters', () => {
  const tools: Technology[] = [
    { id: 1, name: 'OpenAI', icon: '', category: 'IA', aiType: 'provider', sortOrder: 1 },
    { id: 2, name: 'GPT Model', icon: '', category: 'IA', aiType: 'model', aiUseCases: ['code'], sortOrder: 2 },
    { id: 3, name: 'Vue', icon: '', category: 'Frontend', sortOrder: 3 },
  ];

  it('filters by family and searches names and declared use cases', () => {
    assert.deepEqual(filterAiTools(tools, { type: 'model' }).map((item) => item.name), ['GPT Model']);
    assert.deepEqual(filterAiTools(tools, { query: 'CODE' }).map((item) => item.name), ['GPT Model']);
    assert.deepEqual(filterAiTools(tools, { query: 'open', type: 'provider' }).map((item) => item.name), ['OpenAI']);
  });

  describe('admin JSON imports', () => {
    it('accepts project metrics with optional evidence fields', () => {
      const result = parseProjectMetricsJson(JSON.stringify([
        { label: 'Pages réalisées', value: '8' },
        { label: 'Score Lighthouse', value: '96', unit: '/100', evidenceUrl: 'https://example.com/report' },
      ]));
      assert.equal(result.error, undefined);
      assert.equal(result.data?.length, 2);
      assert.equal(result.data?.[1].evidenceUrl, 'https://example.com/report');
    });

    it('rejects invalid project metric JSON without returning partial data', () => {
      const result = parseProjectMetricsJson('[{"label":"Score","value":"90","extra":true}]');
      assert.equal(result.data, undefined);
      assert.match(result.error || '', /inconnu/);
      const tooManyMetrics = Array.from({ length: 13 }, () => ({ label: 'Test', value: '1' }));
      assert.match(parseProjectMetricsJson(JSON.stringify(tooManyMetrics)).error || '', /12 métriques/);
    });

    it('validates skill imports, supplies defaults, and identifies duplicates', () => {
      const result = parseSkillImportJson(JSON.stringify([
        { name: 'Vue.js' },
        { name: 'TypeScript', category: 'Langages', level: 85, icon: 'logos:typescript-icon' },
        { name: 'Vue.js', category: 'Frontend', level: 90 },
        { name: 'Bad level', level: 101 },
      ]), ['Existing']);
      assert.equal(result.error, undefined);
      assert.equal(result.rows?.[0].category, 'Full Stack');
      assert.equal(result.rows?.[0].level, 75);
      assert.equal(result.rows?.[2].duplicate, true);
      assert.match(result.rows?.[3].error || '', /Niveau attendu/);
    });
  });

  it('parses unique verified use cases from comma, semicolon or line-separated input', () => {
    assert.deepEqual(parseAiUseCasesInput('Code, recherche;\nRédaction, Code'), ['Code', 'recherche', 'Rédaction']);
  });
});

describe('contact input validation', () => {
  const message = { name: 'Carrel', email: 'carrel@example.com', subject: '', message: 'Bonjour, voici mon projet.' };

  it('accepts valid contact data and strips the anti-spam honeypot', () => {
    const parsed = contactInputSchema.safeParse({ ...message, website: '' });
    assert.equal(parsed.success, true);
    if (parsed.success) assert.equal('website' in parsed.data, false);
  });

  it('rejects contact submissions that fill the hidden honeypot', () => {
    assert.equal(contactInputSchema.safeParse({ ...message, website: 'spam' }).success, false);
  });

  it('rejects invalid e-mail addresses and short messages', () => {
    assert.equal(contactInputSchema.safeParse({ ...message, email: 'nope' }).success, false);
    assert.equal(contactInputSchema.safeParse({ ...message, message: 'Hi' }).success, false);
  });
});
