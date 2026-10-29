import assert from 'node:assert/strict';
import test from 'node:test';
import { hasDuplicateGithubRepository, normalizeGithubRepositoryUrl } from '../../shared/githubRepository';
import { normalizeGithubRepositoryList } from './githubRepositories';

test('GitHub repository URLs are canonicalized to one stable repository identity', () => {
  assert.equal(normalizeGithubRepositoryUrl('http://github.com/Owner/Repo.git/?tab=readme'), 'https://github.com/owner/repo');
  assert.equal(normalizeGithubRepositoryUrl('https://github.com/owner/repo/'), 'https://github.com/owner/repo');
  assert.equal(normalizeGithubRepositoryUrl('https://example.com/Repo/'), 'https://example.com/Repo/');
});

test('a GitHub repository cannot be assigned to another project, but remains editable on its own project', () => {
  const projects = [
    { id: 1, repoUrl: 'https://github.com/Owner/Repo.git' },
    { id: 2, repoUrl: null },
  ];
  assert.equal(hasDuplicateGithubRepository('http://github.com/owner/repo/', projects), true);
  assert.equal(hasDuplicateGithubRepository('https://github.com/owner/repo', projects, 1), false);
  assert.equal(hasDuplicateGithubRepository('', projects), false);
});

test('repository picker data is normalized and never exposes credential fields', () => {
  const repositories = normalizeGithubRepositoryList([
    {
      id: 42,
      full_name: 'owner/storefront',
      html_url: 'https://github.com/owner/storefront',
      description: 'Online shop',
      homepage: 'https://store.example',
      private: true,
      updated_at: '2026-10-28T12:00:00Z',
      token: 'must-not-be-returned',
    },
    { id: 43, full_name: 'owner/invalid', html_url: 'http://github.com/owner/invalid' },
    { id: 44, full_name: 'owner/invalid', html_url: 'https://example.com/owner/invalid' },
  ], { id: 'personal', name: 'Personnel' });

  assert.deepEqual(repositories, [{
    id: 'personal:42',
    fullName: 'owner/storefront',
    url: 'https://github.com/owner/storefront',
    description: 'Online shop',
    homepage: 'https://store.example',
    isPrivate: true,
    accountName: 'Personnel',
    updatedAt: '2026-10-28T12:00:00Z',
  }]);
});
