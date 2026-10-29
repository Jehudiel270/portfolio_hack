import { defineEventHandler } from 'h3';
import { useRuntimeConfig } from '#imports';
import { AI_PROVIDER_DETAILS, type AiProvider } from '~/shared/adminAi';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { aiProviderCredentials } from '~/server/utils/schema';
import { getProviderCredential, listGeminiCredentials } from '~/server/utils/aiProviders';

const GEMINI_MODEL_FALLBACK = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Rapide, polyvalent et économique. Bon choix par défaut pour la rédaction, les analyses, les métriques et les actions du dashboard.' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Capacités de raisonnement plus fortes pour les demandes complexes, longues ou nécessitant une analyse détaillée.' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Modèle rapide adapté aux tâches courantes à faible latence; recommandé seulement si la 2.5 Flash n’est pas disponible sur ton compte.' },
];

const STATIC_MODEL_CATALOG: Partial<Record<AiProvider, Array<{ id: string; label: string; description: string }>>> = {
  openai: [
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini', description: 'Rapide et économique, adapté aux rédactions courtes et moyennes du dashboard.' },
    { id: 'gpt-4.1', label: 'GPT-4.1', description: 'Modèle polyvalent plus performant pour les longues demandes et raisonnements complexes.' },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini', description: 'Modèle rapide de génération de texte à faible latence.' },
    { id: 'o3-mini', label: 'o3-mini', description: 'Modèle de raisonnement compact pour les analyses techniques nécessitant davantage de précision.' },
  ],
  anthropic: [
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', description: 'Rapide, économique et adapté aux rédactions courantes.' },
    { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', description: 'Équilibre avancé entre qualité rédactionnelle, raisonnement et vitesse.' },
  ],
  mistral: [
    { id: 'mistral-small-latest', label: 'Mistral Small', description: 'Modèle rapide et économique pour les textes du back-office.' },
    { id: 'mistral-medium-latest', label: 'Mistral Medium', description: 'Qualité supérieure pour les rédactions et analyses plus exigeantes.' },
    { id: 'mistral-large-latest', label: 'Mistral Large', description: 'Modèle haut niveau pour les tâches complexes et longues.' },
  ],
  deepseek: [
    { id: 'deepseek-chat', label: 'DeepSeek Chat', description: 'Modèle généraliste et économique pour la rédaction et l’assistance administrative.' },
    { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner', description: 'Modèle orienté raisonnement pour les demandes techniques complexes.' },
  ],
  stability: [{ id: 'stable-image-ultra', label: 'Stable Image Ultra', description: 'Génération d’images premium sans logo visible ni interface parasite.' }],
};

async function discoverOpenAiCompatibleModels(provider: AiProvider, apiKey: string, fallback: Array<{id:string;label:string;description:string}>, url: string, authorizationPrefix = 'Bearer') {
  if (!apiKey) return fallback;
  try {
    const response = await fetch(url, { headers: { authorization: `${authorizationPrefix} ${apiKey}` }, signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return fallback;
    const payload = await response.json() as { data?: Array<{ id?: string }> };
    const models = (payload.data || []).map(item => item.id?.trim()).filter((id): id is string => Boolean(id));
    const matched = fallback.filter(item => models.includes(item.id));
    return matched.length ? matched : fallback;
  } catch {
    return fallback;
  }
}

async function discoverGeminiModels(apiKey: string) {
  if (!apiKey) return GEMINI_MODEL_FALLBACK;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=100`, { signal: AbortSignal.timeout(8_000) });
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
    let availableModels: Array<{ id: string; label: string; description: string }> | undefined;
    if (id === 'gemini') availableModels = geminiModels;
    else if (id === 'openai' || id === 'mistral' || id === 'deepseek' || id === 'anthropic') {
      const fallback = STATIC_MODEL_CATALOG[id] || [{ id: details.defaultModel, label: details.defaultModel, description: 'Modèle actuellement configuré.' }];
      try {
        const credential = await getProviderCredential(id);
        if (id === 'openai') availableModels = await discoverOpenAiCompatibleModels(id, credential?.apiKey || '', fallback, 'https://api.openai.com/v1/models');
        else if (id === 'mistral') availableModels = await discoverOpenAiCompatibleModels(id, credential?.apiKey || '', fallback, 'https://api.mistral.ai/v1/models');
        else if (id === 'deepseek') availableModels = await discoverOpenAiCompatibleModels(id, credential?.apiKey || '', fallback, 'https://api.deepseek.com/models');
        else availableModels = fallback;
      } catch { availableModels = fallback; }
    } else if (id === 'stability') {
      availableModels = STATIC_MODEL_CATALOG.stability;
    }
    return {
      id,
      ...details,
      configured: keyConfigured,
      managedInDashboard,
      model: stored.get(provider) || (id === 'gemini' && keyConfigured ? String(config.geminiModel || details.defaultModel) : details.defaultModel),
      ...(availableModels?.length ? { availableModels } : {}),
    };
  }));
  return { providers };
});
