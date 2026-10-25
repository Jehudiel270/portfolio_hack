import { useRequestURL, useRuntimeConfig } from '#imports';

export function usePublicSiteUrl(): string {
  const configuredUrl = String(useRuntimeConfig().public.siteUrl || '').trim();
  const requestOrigin = useRequestURL().origin;

  if (!configuredUrl || /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/?$/i.test(configuredUrl)) {
    return requestOrigin;
  }

  return new URL(configuredUrl, requestOrigin).origin;
}
