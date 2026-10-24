import type { Technology } from '~/composables/usePortfolioData';

export interface AiFilters {
  query?: string;
  type?: string;
}

export function filterAiTools(items: Technology[], filters: AiFilters): Technology[] {
  const query = filters.query?.trim().toLocaleLowerCase('fr') || '';
  const type = filters.type || '';

  return items.filter((item) => {
    if (item.category !== 'IA') return false;
    if (type && (item.aiType || 'tool') !== type) return false;
    if (!query) return true;

    const searchableText = [
      item.name,
      item.description || '',
      ...(item.aiUseCases || []),
    ].join(' ').toLocaleLowerCase('fr');
    return searchableText.includes(query);
  });
}
