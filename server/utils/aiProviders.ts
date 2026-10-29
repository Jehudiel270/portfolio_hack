import { createCipheriv, createDecipheriv, randomBytes, hkdfSync } from 'node:crypto';
import { createError } from 'h3';
import { useRuntimeConfig } from '#imports';
import { eq, gte, sql } from 'drizzle-orm';
import { AI_PROVIDER_DETAILS, type AiProvider, type AiTextProvider } from '~/shared/adminAi';
import { getDatabase } from '~/server/utils/database';
import { aiProviderCredentials, aiProviderUsage } from '~/server/utils/schema';
import { buildScreenshotRequest, MAX_SITE_CAPTURE_BYTES, type SiteCaptureMode } from '~/server/utils/siteCapture';
import { createGithubAccount, decodeGithubAccounts, encodeGithubAccounts, MAX_GITHUB_ACCOUNTS, shouldTryNextGithubCredential } from '~/server/utils/githubAccounts';

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
  if (provider === 'github') {
    const [account] = decodeGithubAccounts(decryptProviderKey(credential.encryptedKey));
    return account ? { apiKey: account.apiKey, model: credential.model } : null;
  }
  if (provider === 'gemini') {
    const [account] = decodeNamedCredentials(credential.encryptedKey);
    return account ? { apiKey: account.apiKey, model: credential.model } : null;
  }
  return { apiKey: decryptProviderKey(credential.encryptedKey), model: credential.model };
}

export async function listGithubCredentials() {
  const [credential] = await getDatabase()
    .select()
    .from(aiProviderCredentials)
    .where(eq(aiProviderCredentials.provider, 'github'))
    .limit(1);
  return credential ? decodeGithubAccounts(decryptProviderKey(credential.encryptedKey)) : [];
}

export async function addGithubCredential(name: string, apiKey: string) {
  const database = getDatabase();
  const [credential] = await database.select().from(aiProviderCredentials)
    .where(eq(aiProviderCredentials.provider, 'github')).limit(1);
  const accounts = credential ? decodeGithubAccounts(decryptProviderKey(credential.encryptedKey)) : [];
  if (accounts.length >= MAX_GITHUB_ACCOUNTS) throw createError({ statusCode: 409, statusMessage: `La limite de ${MAX_GITHUB_ACCOUNTS} comptes GitHub est atteinte.` });
  accounts.push(createGithubAccount(name, apiKey));
  const encryptedKey = encryptProviderKey(encodeGithubAccounts(accounts));
  if (credential) {
    await database.update(aiProviderCredentials)
      .set({ encryptedKey, updatedAt: new Date() })
      .where(eq(aiProviderCredentials.provider, 'github'));
  } else {
    await database.insert(aiProviderCredentials).values({
      provider: 'github',
      encryptedKey,
      model: AI_PROVIDER_DETAILS.github.defaultModel,
    });
  }
  return accounts.map(account => ({ id: account.id, name: account.name }));
}

export async function removeGithubCredential(id: string) {
  const database = getDatabase();
  const [credential] = await database.select().from(aiProviderCredentials)
    .where(eq(aiProviderCredentials.provider, 'github')).limit(1);
  if (!credential) return null;
  const accounts = decodeGithubAccounts(decryptProviderKey(credential.encryptedKey));
  const nextAccounts = accounts.filter(account => account.id !== id);
  if (accounts.length === nextAccounts.length) return null;
  if (!nextAccounts.length) {
    await database.delete(aiProviderCredentials).where(eq(aiProviderCredentials.provider, 'github'));
    return [];
  }
  const encryptedKey = encryptProviderKey(encodeGithubAccounts(nextAccounts));
  await database.update(aiProviderCredentials)
    .set({ encryptedKey, updatedAt: new Date() })
    .where(eq(aiProviderCredentials.provider, 'github'));
  return nextAccounts.map(account => ({ id: account.id, name: account.name }));
}

type NamedAiCredential = { id: string; name: string; apiKey: string };
const MAX_GEMINI_KEYS = 10;

function decodeNamedCredentials(value: string): NamedAiCredential[] {
  try {
    const parsed = JSON.parse(decryptProviderKey(value)) as { version?: unknown; accounts?: unknown };
    if (parsed.version === 1 && Array.isArray(parsed.accounts)) {
      return parsed.accounts.filter((item): item is NamedAiCredential =>
        Boolean(item && typeof item === 'object' && typeof (item as NamedAiCredential).id === 'string' && typeof (item as NamedAiCredential).name === 'string' && typeof (item as NamedAiCredential).apiKey === 'string'));
    }
  } catch { /* compatibility with the legacy plain-key format */ }
  return [{ id: 'legacy', name: 'Clé existante', apiKey: decryptProviderKey(value) }];
}

export async function listGeminiCredentials() {
  const [credential] = await getDatabase().select().from(aiProviderCredentials)
    .where(eq(aiProviderCredentials.provider, 'gemini')).limit(1);
  return credential ? decodeNamedCredentials(credential.encryptedKey) : [];
}

export async function addGeminiCredential(name: string, apiKey: string) {
  const database = getDatabase();
  const [credential] = await database.select().from(aiProviderCredentials)
    .where(eq(aiProviderCredentials.provider, 'gemini')).limit(1);
  const accounts = credential ? decodeNamedCredentials(credential.encryptedKey) : [];
  if (accounts.length >= MAX_GEMINI_KEYS) throw createError({ statusCode: 409, statusMessage: `La limite de ${MAX_GEMINI_KEYS} clés Gemini est atteinte.` });
  accounts.push({ id: `gemini-${randomBytes(8).toString('hex')}`, name, apiKey });
  const encryptedKey = encryptProviderKey(JSON.stringify({ version: 1, accounts }));
  if (credential) {
    await database.update(aiProviderCredentials).set({ encryptedKey, updatedAt: new Date() }).where(eq(aiProviderCredentials.provider, 'gemini'));
  } else {
    await database.insert(aiProviderCredentials).values({ provider: 'gemini', encryptedKey, model: AI_PROVIDER_DETAILS.gemini.defaultModel });
  }
  return accounts.map(({ id, name }) => ({ id, name }));
}

export async function removeGeminiCredential(id: string) {
  const database = getDatabase();
  const [credential] = await database.select().from(aiProviderCredentials)
    .where(eq(aiProviderCredentials.provider, 'gemini')).limit(1);
  if (!credential) return null;
  const accounts = decodeNamedCredentials(credential.encryptedKey).filter(account => account.id !== id);
  if (!accounts.length) {
    await database.delete(aiProviderCredentials).where(eq(aiProviderCredentials.provider, 'gemini'));
    return [];
  }
  await database.update(aiProviderCredentials)
    .set({ encryptedKey: encryptProviderKey(JSON.stringify({ version: 1, accounts })), updatedAt: new Date() })
    .where(eq(aiProviderCredentials.provider, 'gemini'));
  return accounts.map(({ id, name }) => ({ id, name }));
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
    case 'stability': return 'https://api.stability.ai';
    case 'github': return 'https://api.github.com';
    case 'gemini': return 'https://generativelanguage.googleapis.com/v1beta';
    case 'screenshotone': return 'https://api.screenshotone.com';
  }
}

async function providerFetch(url: string, init?: RequestInit, timeoutMs = 12_000, providerName = 'fournisseur IA') {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw createError({ statusCode: 502, statusMessage: timedOut ? `${providerName} ne répond pas à temps.` : `Connexion à ${providerName} impossible.` });
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
  if (provider === 'screenshotone') {
    throw createError({ statusCode: 400, statusMessage: 'La clé ScreenshotOne est vérifiée lors d’une capture consentie, car le test consommerait un quota.' });
  }
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

export async function callTextProvider(provider: AiTextProvider, apiKey: string, model: string, system: string, prompt: string, contextUrl?: string) {
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

export async function callTextProviderWithGeminiFallback(apiKeys: string[], model: string, system: string, prompt: string, contextUrl?: string) {
  let lastError: unknown;
  for (const apiKey of apiKeys) {
    try {
      return await callTextProvider('gemini', apiKey, model, system, prompt, contextUrl);
    } catch (error) {
      lastError = error;
      const status = error && typeof error === 'object' && 'statusCode' in error ? Number((error as { statusCode?: unknown }).statusCode) : 0;
      if (![429, 403, 502].includes(status)) throw error;
    }
  }
  throw lastError || createError({ statusCode: 503, statusMessage: 'Toutes les clés Gemini disponibles sont indisponibles.' });
}

export async function generateGeminiImage(apiKey: string, prompt: string) {
  const model = 'imagen-4.0-generate-001';
  const response = await providerFetch(`${apiBase('gemini')}/models/${model}:predict`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: '16:9' } }),
  }, 60_000, 'Gemini Images');
  if (!response.ok) {
    const statusMessage = response.status === 429 ? 'Quota image Gemini dépassé ou limite de débit atteinte.' : response.status === 401 || response.status === 403 ? 'Gemini Images refuse cette clé ou ce modèle.' : `Gemini Images n’a pas pu générer l’image (HTTP ${response.status}).`;
    throw createError({ statusCode: response.status === 429 ? 429 : 502, statusMessage });
  }
  const payload = await providerJson<{ predictions?: Array<{ bytesBase64Encoded?: unknown }> }>(response, 'Gemini Images');
  const encoded = payload.predictions?.[0]?.bytesBase64Encoded;
  if (typeof encoded !== 'string') throw createError({ statusCode: 502, statusMessage: 'Gemini Images n’a pas renvoyé une image exploitable.' });
  return `data:image/png;base64,${encoded}`;
}

export async function generateStabilityImage(apiKey: string, prompt: string) {
  const form = new FormData();
  form.append('prompt', `${prompt}\nNo visible text, no letters, no words, no logo, no watermark, no product UI, no fake interface.`);
  form.append('aspect_ratio', '16:9');
  form.append('output_format', 'png');
  form.append('mode', 'text-to-image');
  const response = await providerFetch(`${apiBase('stability')}/v2beta/stable-image/generate/ultra`, {
    method: 'POST', headers: { authorization: `Bearer ${apiKey}`, accept: 'image/*' }, body: form,
  }, 60_000, 'Stability AI');
  if (!response.ok) {
    throw createError({ statusCode: response.status === 429 ? 429 : 502, statusMessage: response.status === 401 || response.status === 403 ? 'Stability AI a refusé la clé configurée.' : `Stability AI n’a pas pu générer l’image (HTTP ${response.status}).` });
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw createError({ statusCode: 502, statusMessage: 'Stability AI a renvoyé une image vide.' });
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

export async function captureSiteScreenshot(apiKey: string, url: string, mode: SiteCaptureMode) {
  const response = await providerFetch(`${apiBase('screenshotone')}/take`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-access-key': apiKey },
    body: JSON.stringify(buildScreenshotRequest(url, mode)),
  }, 30_000, 'ScreenshotOne');
  if (!response.ok) {
    let errorCode = '';
    try {
      const payload = await response.json() as { error_code?: unknown };
      if (typeof payload.error_code === 'string') errorCode = payload.error_code;
    } catch {
      errorCode = '';
    }
    if (errorCode === 'access_key_invalid' || errorCode === 'access_key_required') {
      throw createError({ statusCode: 502, statusMessage: 'ScreenshotOne a refusé la clé. Vérifie-la dans IA & modèles.' });
    }
    if (response.status === 429 || errorCode === 'screenshots_limit_reached' || errorCode === 'concurrency_limit_reached') {
      throw createError({ statusCode: 429, statusMessage: 'Quota ou limite de captures atteint chez ScreenshotOne. Vérifie son tableau de bord avant de réessayer.' });
    }
    throw createError({ statusCode: 502, statusMessage: `ScreenshotOne a refusé la capture (HTTP ${response.status}). Vérifie la clé, le quota et l’URL publique.` });
  }
  if (!response.headers.get('content-type')?.toLowerCase().startsWith('image/jpeg')) {
    throw createError({ statusCode: 502, statusMessage: 'ScreenshotOne n’a pas retourné une image JPEG exploitable.' });
  }
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_SITE_CAPTURE_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'La capture dépasse 4 Mo. Essaie le mode bureau ou mobile plutôt que pleine page.' });
  }
  if (!response.body) throw createError({ statusCode: 502, statusMessage: 'ScreenshotOne a retourné une image vide.' });
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_SITE_CAPTURE_BYTES) {
        await reader.cancel();
        throw createError({ statusCode: 413, statusMessage: 'La capture dépasse 4 Mo. Essaie le mode bureau ou mobile plutôt que pleine page.' });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!totalBytes) throw createError({ statusCode: 502, statusMessage: 'ScreenshotOne a retourné une image vide.' });
  return Buffer.concat(chunks, totalBytes);
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

export async function searchGithubRepositoryContext(query: string, apiKeys: string[] = []) {
  const credentials = [...new Set(apiKeys.filter(Boolean))];
  if (!credentials.length || !query.trim()) return '';
  const seen = new Set<string>();
  const repositories: Array<{ fullName: string; description: string; url: string }> = [];
  for (const apiKey of credentials) {
    const headers: Record<string, string> = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', authorization: `Bearer ${apiKey}` };
    const searchUrl = `${apiBase('github')}/search/repositories?q=${encodeURIComponent(`${query.trim()} in:name,description,readme`)}&per_page=5`;
    try {
      const response = await providerFetch(searchUrl, { headers }, 12_000, 'GitHub');
      if (!response.ok) continue;
      const payload = await providerJson<{ items?: Array<{ full_name?: unknown; description?: unknown; html_url?: unknown }> }>(response, 'GitHub');
      for (const item of payload.items || []) {
        if (typeof item.full_name !== 'string' || seen.has(item.full_name)) continue;
        seen.add(item.full_name);
        repositories.push({ fullName: item.full_name, description: typeof item.description === 'string' ? item.description : '', url: typeof item.html_url === 'string' ? item.html_url : '' });
      }
    } catch {
      continue;
    }
    if (repositories.length >= 8) break;
  }
  const parts: string[] = [];
  for (const repository of repositories.slice(0, 8)) {
    try {
      const readme = await readGithubReadme(repository.url, credentials);
      parts.push(`Dépôt: ${repository.fullName}\nDescription GitHub: ${repository.description}\nURL: ${repository.url}\nREADME:\n${readme}`);
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch {
      parts.push(`Dépôt: ${repository.fullName}\nDescription GitHub: ${repository.description}\nURL: ${repository.url}`);
    }
  }
  return parts.join('\n\n---\n\n').slice(0, 30_000);
}

export async function readGithubReadme(repoUrl: string, apiKeys: string[] = []) {
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
  const path = `${apiBase('github')}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo.replace(/\.git$/u, ''))}/readme`;
  const credentials = [...new Set(apiKeys.filter(Boolean))];
  if (!credentials.length) credentials.push('');
  let response: Response | null = null;
  for (const apiKey of credentials) {
    const headers: Record<string, string> = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' };
    if (apiKey) headers.authorization = `Bearer ${apiKey}`;
    response = await providerFetch(path, { headers });
    if (response.ok || !shouldTryNextGithubCredential(response.status)) break;
  }
  if (!response) throw createError({ statusCode: 502, statusMessage: 'Aucun compte GitHub n’est disponible pour lire ce dépôt.' });
  if (response.status === 404) throw createError({ statusCode: 404, statusMessage: 'README introuvable ou aucun des comptes GitHub enregistrés n’a accès au dépôt.' });
  if (response.status === 403 || response.status === 429) throw createError({ statusCode: 429, statusMessage: 'Quota GitHub atteint ou aucun des comptes enregistrés ne peut lire ce dépôt.' });
  if (response.status === 401) throw createError({ statusCode: 502, statusMessage: 'GitHub a refusé les jetons configurés. Vérifie leur validité dans IA & modèles.' });
  if (!response.ok) throw createError({ statusCode: 502, statusMessage: `GitHub n’a pas pu lire ce dépôt (HTTP ${response.status}).` });
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > 200_000) throw createError({ statusCode: 413, statusMessage: 'Le README est trop volumineux.' });
  const readme = await providerJson<{ content?: unknown; encoding?: unknown; size?: unknown }>(response, 'GitHub');
  if (readme.encoding !== 'base64' || typeof readme.content !== 'string' || Number(readme.size) > 128_000) {
    throw createError({ statusCode: 413, statusMessage: 'Le README est trop volumineux ou dans un format non pris en charge.' });
  }
  return Buffer.from(readme.content.replace(/\s+/gu, ''), 'base64').toString('utf8').slice(0, 12_000);
}
