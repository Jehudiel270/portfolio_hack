import { randomBytes } from 'node:crypto';

export const MAX_GITHUB_ACCOUNTS = 25;

export type GithubAccountSecret = {
  id: string;
  name: string;
  apiKey: string;
};

export function decodeGithubAccounts(value: string): GithubAccountSecret[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return value.trim() ? [{ id: 'legacy', name: 'Jeton GitHub existant', apiKey: value }] : [];
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return value.trim() ? [{ id: 'legacy', name: 'Jeton GitHub existant', apiKey: value }] : [];
  }
  const store = parsed as { version?: unknown; accounts?: unknown };
  if (store.version !== 1 || !Array.isArray(store.accounts)) {
    return value.trim() ? [{ id: 'legacy', name: 'Jeton GitHub existant', apiKey: value }] : [];
  }
  return store.accounts.filter((account): account is GithubAccountSecret =>
    Boolean(account)
    && typeof account === 'object'
    && typeof (account as GithubAccountSecret).id === 'string'
    && typeof (account as GithubAccountSecret).name === 'string'
    && typeof (account as GithubAccountSecret).apiKey === 'string',
  );
}

export function encodeGithubAccounts(accounts: GithubAccountSecret[]) {
  return JSON.stringify({ version: 1, accounts });
}

export function createGithubAccount(name: string, apiKey: string): GithubAccountSecret {
  return { id: randomBytes(16).toString('hex'), name, apiKey };
}

export function maskGithubAccount(account: GithubAccountSecret) {
  return { id: account.id, name: account.name };
}

export function shouldTryNextGithubCredential(status: number) {
  return [401, 403, 404, 429].includes(status);
}
