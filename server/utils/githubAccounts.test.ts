import assert from 'node:assert/strict';
import test from 'node:test';
import { createGithubAccount, decodeGithubAccounts, encodeGithubAccounts, MAX_GITHUB_ACCOUNTS, maskGithubAccount, shouldTryNextGithubCredential } from './githubAccounts';

test('GitHub accounts preserve legacy single tokens and encode multiple named secrets', () => {
  const legacy = decodeGithubAccounts('ghp_legacytokenvalue123456');
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].id, 'legacy');
  assert.equal(legacy[0].apiKey, 'ghp_legacytokenvalue123456');

  const accounts = [
    createGithubAccount('Personnel', 'ghp_personal123456789012'),
    createGithubAccount('Organisation', 'github_pat_org123456789012'),
  ];
  assert.deepEqual(decodeGithubAccounts(encodeGithubAccounts(accounts)), accounts);
  assert.deepEqual(maskGithubAccount(accounts[0]), { id: accounts[0].id, name: 'Personnel' });
  assert.match(accounts[0].id, /^[a-f0-9]{32}$/u);
  assert.equal(MAX_GITHUB_ACCOUNTS, 25);
});

test('GitHub README lookup can fall back on credentials rejected for the current repository', () => {
  for (const status of [401, 403, 404, 429]) assert.equal(shouldTryNextGithubCredential(status), true);
  for (const status of [200, 400, 500]) assert.equal(shouldTryNextGithubCredential(status), false);
});
