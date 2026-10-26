import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterAiTools, parseAiUseCasesInput } from '../../composables/aiFilters';
import { filterProjects } from '../../composables/projectFilters';
import type { Technology } from '../../composables/usePortfolioData';
import { contactInputSchema } from './contactValidation';

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
