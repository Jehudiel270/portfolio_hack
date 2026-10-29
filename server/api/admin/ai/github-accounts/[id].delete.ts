import { createError, defineEventHandler, getRouterParam } from 'h3';
import { removeGithubCredential } from '~/server/utils/aiProviders';
import { requireSuperAdmin } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event);
  const id = getRouterParam(event, 'id') || '';
  if (!/^(?:legacy|[a-f0-9]{32})$/u.test(id)) throw createError({ statusCode: 400, statusMessage: 'Compte GitHub invalide.' });
  const accounts = await removeGithubCredential(id);
  if (!accounts) throw createError({ statusCode: 404, statusMessage: 'Ce compte GitHub n’existe plus.' });
  return { removed: true, accounts };
});
