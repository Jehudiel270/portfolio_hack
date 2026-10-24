import type { AiAccessMode, AiType } from '~/composables/usePortfolioData';

export const aiTypeLabels: Record<AiType, string> = {
  provider: 'Fournisseur',
  model: 'Modèle',
  assistant: 'Assistant / application',
  tool: 'Outil / framework',
};

export const aiAccessModeLabels: Record<AiAccessMode, string> = {
  web: 'Web',
  api: 'API',
  local: 'Local',
  hybrid: 'Hybride',
  other: 'Autre',
};

export function getAiTypeLabel(type?: AiType | null) {
  return aiTypeLabels[type || 'tool'];
}

export function getAiAccessModeLabel(mode?: AiAccessMode | null) {
  return mode ? aiAccessModeLabels[mode] : '';
}
