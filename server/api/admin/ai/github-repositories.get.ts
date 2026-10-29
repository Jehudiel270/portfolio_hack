import { defineEventHandler } from 'h3';
import { requireAdmin } from '~/server/utils/auth';
import { enforceAiRequestLimit } from '~/server/utils/aiRateLimit';
import { listGithubCredentials, listGithubRepositories } from '~/server/utils/aiProviders';

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  enforceAiRequestLimit(admin.id, 'github-repositories', 20);
  const accounts = await listGithubCredentials();
  if (!accounts.length) {
    return { repositories: [], warnings: ['Aucun compte GitHub n’est configuré dans API & fournisseurs.'] };
  }
  return listGithubRepositories(accounts);
});
