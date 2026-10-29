import { defineEventHandler } from 'h3';
import { useRuntimeConfig } from '#imports';
import { AI_PROVIDER_DETAILS, type AiProvider } from '~/shared/adminAi';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { aiProviderCredentials } from '~/server/utils/schema';
import { listGeminiCredentials } from '~/server/utils/aiProviders';

const GEMINI_MODEL_FALLBACK = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Rapide, polyvalent et économique. Bon choix par défaut pour la rédaction, les analyses, les métriques et les actions du dashboard.' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Capacités de raisonnement plus fortes pour les demandes complexes, longues ou nécessitant une analyse détaillée.' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Modèle rapide adapté aux tâches courantes à faible latence; recommandé seulement si la 2.5 Flash n’est pas disponible sur ton compte.' },
];

async function discoverGeminiModels(apiKey: string) {
  if (!apiKey) return GEMINI_MODEL_FALLBACK;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=100`);
    if (!response.ok) return GEMINI_MODEL_FALLBACK;
    const payload = await response.json() as { models?: Array<{ name?: string; displayName?: string; description?: string; supportedGenerationMethods?: string[] }> };
    const models = (payload.models || [])
      .filter(model => model.name?.startsWith('models/gemini') && model.supportedGenerationMethods?.includes('generateContent'))
      .map(model => {
        const id = model.name?.replace(/^models\//, '') || '';
        if (!id) return null;
        return {
          id,
          label: model.displayName?.trim() || id,
          description: model.description?.trim() || `Modèle disponible auprès de Google Gemini et compatible avec generateContent (${id}).`,
        };
      })
      .filter((model): model is { id: string; label: string; description: string } => Boolean(model));
    return models.length ? models : GEMINI_MODEL_FALLBACK;
  } catch {
    return GEMINI_MODEL_FALLBACK;
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const credentials = await getDatabase().select({
    provider: aiProviderCredentials.provider,
    model: aiProviderCredentials.model,
  }).from(aiProviderCredentials);
  const config = useRuntimeConfig(event);
  const stored = new Map(credentials.map(row => [row.provider, row.model]));
  let geminiApiKey = '';
  try {
    const geminiAccounts = await listGeminiCredentials();
    geminiApiKey = geminiAccounts[0]?.apiKey || String(config.geminiApiKey || '').trim();
  } catch {
    geminiApiKey = String(config.geminiApiKey || '').trim();
  }
  const geminiModels = geminiApiKey ? await discoverGeminiModels(geminiApiKey) : GEMINI_MODEL_FALLBACK;
  const providers = await Promise.all(Object.entries(AI_PROVIDER_DETAILS).map(async ([provider, details]) => {
    const id = provider as AiProvider;
    const managedInDashboard = stored.has(provider);
    const keyConfigured = stored.has(provider) || id === 'gemini' && Boolean(String(config.geminiApiKey || '').trim());
    return {
      id,
      ...details,
      configured: keyConfigured,
      managedInDashboard,
      model: stored.get(provider) || (id === 'gemini' && keyConfigured ? String(config.geminiModel || details.defaultModel) : details.defaultModel),
      ...(id === 'gemini' ? { availableModels: geminiModels } : {}),
    };
  }));
  return { providers };
});
