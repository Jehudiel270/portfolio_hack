export const AI_DRAFT_FIELDS = {
  projects: ['title', 'slug', 'description', 'tags', 'projectType', 'caseRole', 'caseContext', 'responsibilities', 'outcomes'],
  journey: ['role', 'organization', 'location', 'startDate', 'endDate', 'description'],
  educations: ['title', 'institution', 'degree', 'location', 'startDate', 'endDate', 'status', 'description'],
  certifications: ['title', 'issuer', 'issuedAt', 'expiresAt', 'skills', 'description'],
  achievements: ['title', 'description', 'date', 'icon'],
  skills: ['name', 'icon', 'level', 'category'],
  technologies: ['name', 'icon', 'category', 'description'],
} as const;

export type AiDraftResource = keyof typeof AI_DRAFT_FIELDS;
