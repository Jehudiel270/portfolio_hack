import type { AiDraftResource } from '~/shared/adminAi';

const projectArrayFields = ['tags', 'categories', 'responsibilities'] as const;
const optionalMetricTextFields = ['context', 'unit', 'period', 'source'] as const;

export function normalizeGeneratedDraft(resource: AiDraftResource, value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const draft = { ...value } as Record<string, unknown>;
  if (resource !== 'projects') return draft;

  for (const field of projectArrayFields) {
    const fieldValue = draft[field];
    if (typeof fieldValue === 'string') {
      draft[field] = fieldValue.split(/\r?\n|,\s*/u).map(item => item.trim()).filter(Boolean);
    }
  }

  if (Array.isArray(draft.metrics)) {
    draft.metrics = draft.metrics.map(metric => {
      if (!metric || typeof metric !== 'object' || Array.isArray(metric)) return metric;
      const normalizedMetric = { ...metric } as Record<string, unknown>;
      for (const field of optionalMetricTextFields) {
        if (normalizedMetric[field] === null) delete normalizedMetric[field];
      }
      return normalizedMetric;
    });
  }

  return draft;
}

export function describeDraftValidationIssues(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return issues.slice(0, 8).map(issue => {
    const path = issue.path.length ? issue.path.map(String).join('.') : 'réponse';
    return `${path} : ${issue.message}`;
  });
}

export function addVerifiedRepositoryHomepage(
  draft: Record<string, unknown>,
  currentDemoUrl: unknown,
  verifiedHomepage: string,
) {
  if (typeof currentDemoUrl === 'string' && currentDemoUrl.trim()) {
    draft.demoUrl = currentDemoUrl;
  } else if (verifiedHomepage) {
    draft.demoUrl = verifiedHomepage;
  } else {
    delete draft.demoUrl;
  }
  return draft;
}
