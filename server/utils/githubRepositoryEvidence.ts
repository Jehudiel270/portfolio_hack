export type GithubTreeEntry = {
  path: string;
  type: string;
  size?: number;
};

const sourceExtensions = /\.(?:vue|tsx?|jsx?|py|go|rs|java|kt|php|rb|cs|sql)$/iu;
const excludedPathParts = /^(?:\.|node_modules$|vendor$|dist$|build$|coverage$|public$|assets$|generated$|__generated__$)/iu;
const secretPathParts = /(?:secret|credential|private[-_]?key|\.env)/iu;
const secretPatterns = [
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/gu,
  /\bsk-[A-Za-z0-9_-]{20,}\b/gu,
  /\bAKIA[0-9A-Z]{16}\b/gu,
  /\bAIza[0-9A-Za-z_-]{30,}\b/gu,
  /((?:api[_-]?key|secret|token|password|private[_-]?key)\s*[:=]\s*["'])([^"']{8,})(["'])/giu,
];

export function selectGithubSourceFiles(entries: GithubTreeEntry[], maxFiles = 4, maxBytes = 16_000) {
  const candidates = entries
    .filter(entry => entry.type === 'blob' && sourceExtensions.test(entry.path))
    .filter(entry => {
      const parts = entry.path.split('/');
      return parts.every(part => !excludedPathParts.test(part) && !secretPathParts.test(part))
        && !/(?:^|\/)(?:lock|package-lock|pnpm-lock|yarn-lock|bun-lock)\./iu.test(entry.path)
        && (!entry.size || entry.size <= 32_000);
    })
    .map(entry => ({
      ...entry,
      priority: (/^(?:src|app|pages|server|routes|api|components|lib)\//iu.test(entry.path) ? 2 : 0)
        + (/(?:^|\/)(?:main|app|index|router|routes|server|controller|model)\.[^.]+$/iu.test(entry.path) ? 3 : 0),
    }))
    .sort((left, right) => right.priority - left.priority || left.path.localeCompare(right.path));

  const selected: string[] = [];
  let totalBytes = 0;
  for (const entry of candidates) {
    const size = entry.size ?? 0;
    if (selected.length >= maxFiles || totalBytes + size > maxBytes) continue;
    selected.push(entry.path);
    totalBytes += size;
  }
  return selected;
}

export function redactRepositorySecrets(content: string) {
  return content
    .replace(secretPatterns[0], '[REDACTED_SECRET]')
    .replace(secretPatterns[1], '[REDACTED_SECRET]')
    .replace(secretPatterns[2], '[REDACTED_SECRET]')
    .replace(secretPatterns[3], '[REDACTED_SECRET]')
    .replace(secretPatterns[4], '$1[REDACTED]$3');
}
