import { normalizeGithubRepositoryUrl } from '../../shared/githubRepository';

export type GithubRepositoryOption = {
  id: string;
  fullName: string;
  url: string;
  description: string;
  homepage: string;
  isPrivate: boolean;
  accountName: string;
  updatedAt: string;
};

type GithubAccountLabel = { id: string; name: string };

export function normalizeGithubRepositoryList(value: unknown, account: GithubAccountLabel): GithubRepositoryOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): GithubRepositoryOption[] => {
    if (!item || typeof item !== 'object') return [];
    const repository = item as Record<string, unknown>;
    if (typeof repository.id !== 'number' || typeof repository.full_name !== 'string' || typeof repository.html_url !== 'string') return [];

    let url: URL;
    try {
      url = new URL(repository.html_url);
    } catch {
      return [];
    }
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') return [];

    return [{
      id: `${account.id}:${repository.id}`,
      fullName: repository.full_name.slice(0, 200),
      url: normalizeGithubRepositoryUrl(url.toString()),
      description: typeof repository.description === 'string' ? repository.description.slice(0, 500) : '',
      homepage: typeof repository.homepage === 'string' ? repository.homepage.slice(0, 500) : '',
      isPrivate: repository.private === true,
      accountName: account.name.slice(0, 60),
      updatedAt: typeof repository.updated_at === 'string' ? repository.updated_at.slice(0, 40) : '',
    }];
  });
}
