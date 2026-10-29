export const AI_DRAFT_FIELDS = {
  projects: ['title', 'slug', 'description', 'tags', 'categories', 'demoUrl', 'repoUrl', 'year', 'projectType', 'caseRole', 'caseContext', 'responsibilities', 'outcomes', 'metrics'],
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

export const PROJECT_AI_DRAFT_INSTRUCTIONS = 'Analyse le dépôt GitHub indiqué et prépare un brouillon complet pour la fiche projet. À partir du nom du dépôt, de sa description, du README, des manifests et du code source fourni, propose tous les champs que les preuves permettent de remplir : title, slug, description, tags, categories, demoUrl uniquement si une vraie URL de démo est explicitement documentée, year uniquement si une date de réalisation est prouvée, projectType, caseRole, caseContext, responsibilities, outcomes et metrics vérifiables. Utilise le nom du dépôt comme titre lisible si aucun meilleur titre n’est indiqué. Garde les technologies dans tags, choisis les catégories dans la liste fournie et limite-les à 12. N’invente aucun fait, client, lien, date, chiffre ou résultat. Laisse vide ou omets les champs impossibles à déduire; retourne metrics: [] sans métrique chiffrée vérifiable.';

export const AI_TEXT_PROVIDERS = ['gemini', 'openai', 'anthropic', 'mistral', 'deepseek'] as const;
export type AiTextProvider = typeof AI_TEXT_PROVIDERS[number];

export const AI_PROVIDER_DETAILS = {
  gemini: { label: 'Google Gemini', defaultModel: 'gemini-2.5-flash', capabilities: ['Rédaction', 'Contexte URL pour les démos', 'Lecture de dépôts GitHub'], balance: 'Crédit non consultable par cette API.' },
  openai: { label: 'OpenAI', defaultModel: 'gpt-4.1-mini', capabilities: ['Rédaction', 'Génération d’images (API Images, séparée)'], balance: 'Solde non consultable avec une clé standard.' },
  anthropic: { label: 'Anthropic Claude', defaultModel: 'claude-haiku-4-5', capabilities: ['Rédaction'], balance: 'Solde non consultable par cette API.' },
  mistral: { label: 'Mistral AI', defaultModel: 'mistral-small-latest', capabilities: ['Rédaction'], balance: 'Solde non consultable par cette API.' },
  deepseek: { label: 'DeepSeek', defaultModel: 'deepseek-chat', capabilities: ['Rédaction'], balance: 'Solde non consultable par cette API.' },
  stability: { label: 'Stability AI', defaultModel: 'stable-image-ultra', capabilities: ['Génération d’images sans interface ni logo parasite'], balance: 'Crédit disponible via le tableau de bord Stability AI.' },
  github: { label: 'GitHub (lecture seule)', defaultModel: 'REST-API', capabilities: ['Lire les dépôts et README publics/privés autorisés'], balance: 'Quota REST disponible via l’API officielle.' },
  screenshotone: { label: 'ScreenshotOne', defaultModel: 'ScreenshotOne-API', capabilities: ['Capture réelle de sites publics · bureau, mobile ou pleine page'], balance: 'Le plan gratuit annonce 100 captures par mois. Le quota restant se consulte dans le tableau de bord du fournisseur.' },
} as const;

export type AiProvider = keyof typeof AI_PROVIDER_DETAILS;
