export const AI_DRAFT_FIELDS = {
  projects: ['title', 'slug', 'description', 'tags', 'demoUrl', 'repoUrl', 'year', 'projectType', 'caseRole', 'caseContext', 'responsibilities', 'outcomes', 'metrics'],
  journey: ['role', 'organization', 'location', 'startDate', 'endDate', 'description'],
  educations: ['title', 'institution', 'degree', 'location', 'startDate', 'endDate', 'status', 'description'],
  certifications: ['title', 'issuer', 'issuedAt', 'expiresAt', 'skills', 'description'],
  achievements: ['title', 'description', 'date', 'icon'],
  testimonials: ['author', 'role', 'organization', 'quote'],
  skills: ['name', 'icon', 'level', 'category'],
  technologies: ['name', 'icon', 'category', 'description', 'aiType', 'aiAccessMode', 'aiUseCases', 'officialUrl'],
  profile: ['name', 'role', 'location', 'education', 'bio'],
} as const;

export type AiDraftResource = keyof typeof AI_DRAFT_FIELDS;

export const AI_PROVIDER_DETAILS = {
  gemini: { label: 'Google Gemini', defaultModel: 'gemini-2.5-flash', capabilities: ['Rédaction', 'Contexte URL pour les démos', 'Lecture de dépôts GitHub'], balance: 'Crédit non consultable par cette API.' },
  openai: { label: 'OpenAI', defaultModel: 'gpt-4.1-mini', capabilities: ['Rédaction', 'Génération d’images (API Images, séparée)'], balance: 'Solde non consultable avec une clé standard.' },
  anthropic: { label: 'Anthropic Claude', defaultModel: 'claude-haiku-4-5', capabilities: ['Rédaction'], balance: 'Solde non consultable par cette API.' },
  mistral: { label: 'Mistral AI', defaultModel: 'mistral-small-latest', capabilities: ['Rédaction'], balance: 'Solde non consultable par cette API.' },
  deepseek: { label: 'DeepSeek', defaultModel: 'deepseek-chat', capabilities: ['Rédaction'], balance: 'Solde non consultable par cette API.' },
  github: { label: 'GitHub (lecture seule)', defaultModel: 'REST-API', capabilities: ['Lire les dépôts et README publics/privés autorisés'], balance: 'Quota REST disponible via l’API officielle.' },
} as const;

export type AiProvider = keyof typeof AI_PROVIDER_DETAILS;
