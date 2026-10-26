const supportedPrefixes = new Set(['logos', 'devicon', 'simple-icons']);

export function createIconifyUrl(prefix: string, slug: string): string {
  const normalizedPrefix = prefix.toLowerCase();
  const normalizedSlug = slug.toLowerCase();
  if (!supportedPrefixes.has(normalizedPrefix) || !/^[a-z0-9-]+$/u.test(normalizedSlug)) return '';

  const color = normalizedPrefix === 'simple-icons' ? '?color=%23e5f2ff' : '';
  return `https://api.iconify.design/${normalizedPrefix}/${normalizedSlug}.svg${color}`;
}
