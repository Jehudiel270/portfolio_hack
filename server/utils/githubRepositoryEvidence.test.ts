import assert from 'node:assert/strict';
import test from 'node:test';
import { redactRepositorySecrets, selectGithubSourceFiles } from './githubRepositoryEvidence';

test('repository evidence selects a small set of relevant source files and excludes generated or secret paths', () => {
  assert.deepEqual(selectGithubSourceFiles([
    { path: 'src/main.ts', type: 'blob', size: 1200 },
    { path: 'src/components/Checkout.vue', type: 'blob', size: 2400 },
    { path: 'src/generated/client.ts', type: 'blob', size: 900 },
    { path: 'src/secrets/credentials.ts', type: 'blob', size: 800 },
    { path: 'node_modules/pkg/index.js', type: 'blob', size: 800 },
    { path: 'README.md', type: 'blob', size: 1000 },
    { path: 'src/too-large.ts', type: 'blob', size: 40_000 },
  ]), ['src/main.ts', 'src/components/Checkout.vue']);
});

test('repository evidence redacts common credential formats before sending source to a model', () => {
  const content = 'const apiKey = "ghp_abcdefghijklmnopqrstuvwxyz";\\nconst password = "super-secret-value";';
  const redacted = redactRepositorySecrets(content);
  assert.doesNotMatch(redacted, /ghp_abcdefghijklmnopqrstuvwxyz|super-secret-value/u);
  assert.match(redacted, /REDACTED/u);
});
