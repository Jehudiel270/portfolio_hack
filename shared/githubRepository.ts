export function normalizeGithubRepositoryUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.hostname.toLowerCase() !== 'github.com'
      || url.username || url.password || url.port) return url.toString();
    const [owner, repository] = url.pathname.split('/').filter(Boolean);
    if (!owner || !repository) return url.toString();
    return `https://github.com/${owner.toLowerCase()}/${repository.replace(/\.git$/iu, '').toLowerCase()}`;
  } catch {
    return value.trim();
  }
}

export function hasDuplicateGithubRepository(
  repositoryUrl: unknown,
  projects: readonly { id: number; repoUrl: unknown }[],
  excludedId?: number,
): boolean {
  const normalizedUrl = normalizeGithubRepositoryUrl(repositoryUrl);
  return Boolean(normalizedUrl && projects.some(project =>
    project.id !== excludedId && normalizeGithubRepositoryUrl(project.repoUrl) === normalizedUrl,
  ));
}
