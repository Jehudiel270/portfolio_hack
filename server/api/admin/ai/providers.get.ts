import { defineEventHandler } from 'h3';
import { useRuntimeConfig } from '#imports';
import { AI_PROVIDER_DETAILS, type AiProvider } from '~/shared/adminAi';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { aiProviderCredentials } from '~/server/utils/schema';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const credentials = await getDatabase().select({
    provider: aiProviderCredentials.provider,
    model: aiProviderCredentials.model,
  }).from(aiProviderCredentials);
  const config = useRuntimeConfig(event);
  const stored = new Map(credentials.map(row => [row.provider, row.model]));
  const providers = Object.entries(AI_PROVIDER_DETAILS).map(([provider, details]) => {
    const id = provider as AiProvider;
    const managedInDashboard = stored.has(provider);
    const keyConfigured = stored.has(provider) || id === 'gemini' && Boolean(String(config.geminiApiKey || '').trim());
    return {
      id,
      ...details,
      configured: keyConfigured,
      managedInDashboard,
      model: stored.get(provider) || (id === 'gemini' && keyConfigured ? String(config.geminiModel || details.defaultModel) : details.defaultModel),
    };
  });
  return { providers };
});
