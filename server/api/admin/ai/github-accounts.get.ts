import { defineEventHandler } from 'h3';
import { listGithubCredentials } from '~/server/utils/aiProviders';
import { maskGithubAccount } from '~/server/utils/githubAccounts';
import { requireAdmin } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const accounts = await listGithubCredentials();
  return accounts.map(maskGithubAccount);
});
