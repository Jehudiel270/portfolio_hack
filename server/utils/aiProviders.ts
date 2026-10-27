import { createCipheriv, createDecipheriv, randomBytes, hkdfSync } from 'node:crypto';
import { createError } from 'h3';
import { useRuntimeConfig } from '#imports';
import { eq, gte, sql } from 'drizzle-orm';
import { AI_PROVIDER_DETAILS, type AiProvider } from '~/shared/adminAi';
import { getDatabase } from '~/server/utils/database';
import { aiProviderCredentials, aiProviderUsage } from '~/server/utils/schema';

const providerNames = Object.keys(AI_PROVIDER_DETAILS) as AiProvider[];

export function isAiProvider(value: string): value is AiProvider {
  return providerNames.includes(value as AiProvider);
}

function vaultKey() {
  const secret = String(useRuntimeConfig().sessionPassword || '');
  if (secret.length < 32) {
    throw createError({ statusCode: 503, statusMessage: 'Le coffre IA nécessite une NUXT_SESSION_PASSWORD d’au moins 32 caractères.' });
  }
  return Buffer.from(hkdfSync('sha256', secret, Buffer.from('carrelfolio-ai-vault-v1'), Buffer.from('provider-api-keys'), 32));
}

export function encryptProviderKey(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', vaultKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64url')).join('.');
}

export function decryptProviderKey(value: string) {
  const [encodedIv, encodedTag, encodedCiphertext, extra] = value.split('.');
  if (!encodedIv || !encodedTag || !encodedCiphertext || extra) {
    throw createError({ statusCode: 503, statusMessage: 'La clé IA chiffrée est illisible. Supprime-la puis enregistre-la à nouveau.' });
  }
  try {
    const decipher = createDecipheriv('aes-256-gcm', vaultKey(), Buffer.from(encodedIv, 'base64url'));
    decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encodedCiphertext, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Impossible de déchiffrer cette clé IA. Vérifie que NUXT_SESSION_PASSWORD n’a pas changé depuis son enregistrement.' });
  }
}

export async function getProviderCredential(provider: AiProvider) {
  const [credential] = await getDatabase()
    .select()
    .from(aiProviderCredentials)
    .where(eq(aiProviderCredentials.provider, provider))
    .limit(1);
  if (!credential && provider === 'gemini') {
    const config = useRuntimeConfig();
    const apiKey = String(config.geminiApiKey || '').trim();
    return apiKey ? { apiKey, model: String(config.geminiModel || AI_PROVIDER_DETAILS.gemini.defaultModel) } : null;
  }
  if (!credential) return null;
  return { apiKey: decryptProviderKey(credential.encryptedKey), model: credential.model };
}

export async function addProviderUsage(provider: AiProvider, inputTokens = 0, outputTokens = 0) {
  const day = new Date().toISOString().slice(0, 10);
  await getDatabase().insert(aiProviderUsage).values({ day, provider, requests: 1, inputTokens, outputTokens })
    .onConflictDoUpdate({
      target: [aiProviderUsage.day, aiProviderUsage.provider],
      set: {
        requests: sql`${aiProviderUsage.requests} + 1`,
        inputTokens: sql`${aiProviderUsage.inputTokens} + ${inputTokens}`,
        outputTokens: sql`${aiProviderUsage.outputTokens} + ${outputTokens}`,
      },
    });
}

export async function listProviderUsage() {
  const since = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return getDatabase().select().from(aiProviderUsage)
    .where(gte(aiProviderUsage.day, since))
    .orderBy(aiProviderUsage.day);
}

function apiBase(provider: AiProvider) {
  switch (provider) {
    case 'openai': return 'https://api.openai.com/v1';
    case 'anthropic': return 'https://api.anthropic.com/v1';
    case 'mistral': return 'https://api.mistral.ai/v1';
    case 'deepseek': return 'https://api.deepseek.com';
    case 'github': return 'https://api.github.com';
    case 'gemini': return 'https://generativelanguage.googleapis.com/v1beta';
  }
}

async function providerFetch(url: string, init?: RequestInit) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(12_000), redirect: 'error' });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw createError({ statusCode: 502, statusMessage: timedOut ? 'Le fournisseur IA ne répond pas à temps.' : 'Connexion au fournisseur IA impossible.' });
  }
}

async function providerJson<T>(response: Response, description: string): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    throw createError({ statusCode: 502, statusMessage: `${description} a renvoyé une réponse JSON illisible.` });
  }
}

export async function checkProviderCredential(provider: AiProvider, apiKey: string) {
  let url = '';
  let headers: Record<string, string> = {};
  if (provider === 'gemini') {
    url = `${apiBase(provider)}/models?pageSize=1`;
    headers = { 'x-goog-api-key': apiKey };
  } else if (provider === 'anthropic') {
    url = `${apiBase(provider)}/models?limit=1`;
    headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
  } else if (provider === 'github') {
    url = `${apiBase(provider)}/rate_limit`;
    headers = { authorization: `Bearer ${apiKey}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' };
  } else {
    url = `${apiBase(provider)}/models`;
    headers = { authorization: `Bearer ${apiKey}` };
  }
  const response = await providerFetch(url, { headers });
  if (!response.ok) {
    const message = response.status === 401 || response.status === 403
      ? 'Le fournisseur a refusé la clé. Vérifie sa validité et ses autorisations.'
      : `Le fournisseur a répondu avec HTTP ${response.status}.`;
    throw createError({ statusCode: response.status === 429 ? 429 : 502, statusMessage: message });
  }
  if (provider === 'github') {
    const payload = await providerJson<{ rate?: { remaining?: number; limit?: number; reset?: number } }>(response, 'GitHub');
    return { connected: true, quota: payload.rate ? { remaining: payload.rate.remaining ?? null, limit: payload.rate.limit ?? null, resetsAt: payload.rate.reset ? new Date(payload.rate.reset * 1000).toISOString() : null } : null };
  }
  return { connected: true, quota: null };
}

export async function callTextProvider(provider: AiProvider, apiKey: string, model: string, system: string, prompt: string, contextUrl?: string) {
  const base = apiBase(provider);
  let response: Response;
  if (provider === 'gemini') {
    response = await providerFetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        ...(contextUrl ? { tools: [{ url_context: {} }] } : {}),
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      }),
    });
  } else if (provider === 'anthropic') {
    response = await providerFetch(`${base}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 3000, system, messages: [{ role: 'user', content: prompt }] }),
    });
  } else {
    response = await providerFetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });
  }
  if (!response.ok) {
    const message = response.status === 429
      ? 'Quota ou limite de débit atteint chez ce fournisseur. Vérifie son tableau de bord de facturation.'
      : response.status === 401 || response.status === 403
        ? 'Le fournisseur a refusé la clé configurée. Vérifie-la dans IA & modèles.'
        : `Le fournisseur IA n’a pas pu générer le brouillon (HTTP ${response.status}).`;
    throw createError({ statusCode: response.status === 429 ? 429 : 502, statusMessage: message });
  }
  const payload = await providerJson<Record<string, any>>(response, 'Le fournisseur IA');
  const text = provider === 'gemini'
    ? payload.candidates?.[0]?.content?.parts?.find((part: { text?: unknown }) => typeof part.text === 'string')?.text
    : provider === 'anthropic'
      ? payload.content?.find((part: { type?: string; text?: unknown }) => part.type === 'text' && typeof part.text === 'string')?.text
      : payload.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw createError({ statusCode: 502, statusMessage: 'Le fournisseur IA n’a pas retourné de texte exploitable.' });
  const usage = provider === 'gemini'
    ? { input: Number(payload.usageMetadata?.promptTokenCount) || 0, output: Number(payload.usageMetadata?.candidatesTokenCount) || 0 }
    : provider === 'anthropic'
      ? { input: Number(payload.usage?.input_tokens) || 0, output: Number(payload.usage?.output_tokens) || 0 }
      : { input: Number(payload.usage?.prompt_tokens) || 0, output: Number(payload.usage?.completion_tokens) || 0 };
  return { text, ...usage };
}

export async function generateOpenAiImage(apiKey: string, prompt: string) {
  const response = await providerFetch(`${apiBase('openai')}/images/generations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1536x1024', quality: 'low', n: 1 }),
  });
  if (!response.ok) {
    const message = response.status === 429
      ? 'Quota image OpenAI dépassé. Vérifie la facturation avant de réessayer.'
      : response.status === 401 || response.status === 403
        ? 'OpenAI a refusé la clé ou l’accès à l’API Images.'
        : `OpenAI n’a pas pu générer l’image (HTTP ${response.status}).`;
    throw createError({ statusCode: response.status === 429 ? 429 : 502, statusMessage: message });
  }
  const payload = await providerJson<{ data?: Array<{ b64_json?: unknown }> }>(response, 'OpenAI Images');
  const encoded = payload.data?.[0]?.b64_json;
  if (typeof encoded !== 'string' || encoded.length > 12_000_000) {
    throw createError({ statusCode: 502, statusMessage: 'OpenAI n’a pas renvoyé une image exploitable.' });
  }
  return `data:image/png;base64,${encoded}`;
}

export async function readGithubReadme(repoUrl: string, apiKey?: string) {
  let url: URL;
  try {
    url = new URL(repoUrl);
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Le lien du dépôt GitHub est invalide.' });
  }
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com' || url.username || url.password) {
    throw createError({ statusCode: 400, statusMessage: 'Seuls les dépôts GitHub (github.com/organisation/depot) sont pris en charge.' });
  }
  const [, owner, repo] = url.pathname.split('/');
  if (!owner || !repo || !/^[A-Za-z0-9_.-]{1,100}$/u.test(owner) || !/^[A-Za-z0-9_.-]{1,100}$/u.test(repo.replace(/\.git$/u, ''))) {
    throw createError({ statusCode: 400, statusMessage: 'Le lien doit pointer directement vers un dépôt GitHub.' });
  }
  const headers: Record<string, string> = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  const path = `${apiBase('github')}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo.replace(/\.git$/u, ''))}/readme`;
  const response = await providerFetch(path, { headers });
  if (response.status === 404) throw createError({ statusCode: 404, statusMessage: 'README introuvable ou dépôt GitHub privé sans jeton autorisé.' });
  if (response.status === 403 || response.status === 429) throw createError({ statusCode: 429, statusMessage: 'Quota GitHub atteint ou le jeton ne peut pas lire ce dépôt.' });
  if (!response.ok) throw createError({ statusCode: 502, statusMessage: `GitHub n’a pas pu lire ce dépôt (HTTP ${response.status}).` });
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > 200_000) throw createError({ statusCode: 413, statusMessage: 'Le README est trop volumineux.' });
  const readme = await providerJson<{ content?: unknown; encoding?: unknown; size?: unknown }>(response, 'GitHub');
  if (readme.encoding !== 'base64' || typeof readme.content !== 'string' || Number(readme.size) > 128_000) {
    throw createError({ statusCode: 413, statusMessage: 'Le README est trop volumineux ou dans un format non pris en charge.' });
  }
  return Buffer.from(readme.content.replace(/\s+/gu, ''), 'base64').toString('utf8').slice(0, 12_000);
}
