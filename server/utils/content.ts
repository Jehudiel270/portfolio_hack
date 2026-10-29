import { createError } from 'h3';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { getDatabase } from './database';
import { achievements, activityLog, certifications, educations, journey, projects, skills, technologies, testimonials } from './schema';
import { isRichTextEmpty, looksLikeHtml, richTextLength, sanitizeHtml } from '#shared/rich-text';

export const resourceTables = { projects, journey, educations, certifications, achievements, testimonials, skills, technologies } as const;
export type ResourceName = keyof typeof resourceTables;
export function getResource(name: string): ResourceName {
  if (!(name in resourceTables)) throw createError({ statusCode: 404, statusMessage: 'Type de contenu inconnu.' });
  return name as ResourceName;
}
const optionalUrl = z.union([z.string().url().max(1200), z.literal(''), z.null()]).optional();
export const contentSchemas = {
  projects: z.object({ title:z.string().trim().min(1).max(160), slug:z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description:z.string().trim().min(1).max(12000), tags:z.array(z.string().trim().min(1).max(40)).max(12).default([]), categories:z.array(z.string().trim().min(1).max(40)).max(12).default([]), demoUrl:optionalUrl, repoUrl:optionalUrl, imageUrl:optionalUrl, year:z.string().max(12).nullable().optional(), projectType:z.string().trim().min(1).max(60).default('Web'), metrics:z.array(z.object({label:z.string().trim().min(1).max(80),value:z.string().trim().min(1).max(100),context:z.string().max(300).optional(),unit:z.string().max(40).optional(),period:z.string().max(80).optional(),source:z.string().max(300).optional(),evidenceUrl:optionalUrl})).max(12).default([]), caseLayout:z.object({accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),layout:z.enum(['standard','editorial']).optional(),showRole:z.boolean().optional(),showContext:z.boolean().optional(),showResponsibilities:z.boolean().optional(),showOutcomes:z.boolean().optional(),showMetrics:z.boolean().optional(),showGallery:z.boolean().optional()}).nullable().optional(), featured:z.coerce.boolean().default(false), caseRole:z.string().max(180).nullable().optional(), caseContext:z.string().max(12000).nullable().optional(), responsibilities:z.array(z.string().trim().min(1).max(500)).max(30).default([]), outcomes:z.string().max(12000).nullable().optional(), gallery:z.array(z.object({url:z.string().url().max(1200),alt:z.string().trim().max(250).default(''),caption:z.string().max(500).default(''),sortOrder:z.coerce.number().int().min(0).max(10000)})).max(20).default([]), publicationStatus:z.enum(['draft','published']).default('published'), publishAt:z.coerce.date().nullable().optional(), sortOrder:z.coerce.number().int().min(0).max(10000).default(0) }),
  journey: z.object({ role:z.string().trim().min(1).max(180), organization:z.string().trim().min(1).max(180), location:z.string().max(120).nullable().optional(), startDate:z.string().trim().min(1).max(32), endDate:z.string().max(32).nullable().optional(), description:z.string().trim().min(1).max(3000), imageUrl:optionalUrl, sortOrder:z.coerce.number().int().min(0).max(10000).default(0) }),
  educations: z.object({ title:z.string().trim().min(1).max(180), institution:z.string().trim().min(1).max(180), degree:z.string().max(180).default(''), location:z.string().max(120).nullable().optional(), startDate:z.string().trim().min(1).max(32), endDate:z.string().max(32).nullable().optional(), status:z.enum(['in_progress','completed']).default('completed'), description:z.string().max(3000).default(''), imageUrl:optionalUrl, sortOrder:z.coerce.number().int().min(0).max(10000).default(0) }),
  certifications: z.object({ title:z.string().trim().min(1).max(180), issuer:z.string().trim().min(1).max(180), issuedAt:z.string().max(32).nullable().optional(), expiresAt:z.string().max(32).nullable().optional(), credentialId:z.string().max(180).nullable().optional(), credentialUrl:optionalUrl, skills:z.array(z.string().trim().min(1).max(80)).max(20).default([]), description:z.string().max(3000).default(''), imageUrl:optionalUrl, sortOrder:z.coerce.number().int().min(0).max(10000).default(0) }),
  achievements: z.object({ title:z.string().trim().min(1).max(180), description:z.string().trim().min(1).max(3000), date:z.string().max(32).nullable().optional(), icon:z.string().max(60).default('Sparkles'), sortOrder:z.coerce.number().int().min(0).max(10000).default(0) }),
  testimonials: z.object({ author:z.string().trim().min(1).max(140), role:z.string().max(180).nullable().optional(), organization:z.string().max(180).nullable().optional(), quote:z.string().trim().min(10).max(2000), permissionConfirmed:z.coerce.boolean().default(false), publicationStatus:z.enum(['draft','published']).default('draft'), sortOrder:z.coerce.number().int().min(0).max(10000).default(0) }),
  skills: z.object({ name:z.string().trim().min(1).max(120), icon:z.string().max(120).default(''), level:z.coerce.number().int().min(0).max(100), category:z.string().trim().min(1).max(80), sortOrder:z.coerce.number().int().min(0).max(10000).default(0) }),
  technologies: z.object({ name:z.string().trim().min(1).max(100), icon:z.string().max(80).default(''), category:z.string().trim().min(1).max(80), aiType:z.enum(['provider','model','assistant','tool']).nullable().optional(), aiProviderId:z.coerce.number().int().positive().nullable().optional(), aiAccessMode:z.enum(['web','api','local','hybrid','other']).nullable().optional(), aiUseCases:z.array(z.string().trim().min(1).max(60)).max(12).optional(), aiVerifiedAt:z.string().max(32).nullable().optional(), description:z.string().max(3000).nullable().optional(), officialUrl:optionalUrl, sortOrder:z.coerce.number().int().min(0).max(10000).default(0) }),
} as const;
type TechnologyAiMetadata = {
  category?: string;
  aiType?: string | null;
  aiProviderId?: number | null;
  aiAccessMode?: string | null;
  aiUseCases?: string[] | null;
  aiVerifiedAt?: string | null;
  description?: string | null;
  officialUrl?: string | null;
};

function sanitizeProjectRichText(value: Record<string, unknown>) {
  for (const key of ['description', 'caseContext', 'outcomes'] as const) {
    const content = value[key];
    if (typeof content !== 'string') continue;
    const sanitized = looksLikeHtml(content) ? sanitizeHtml(content) : content;
    if (key === 'description' && isRichTextEmpty(sanitized)) {
      throw createError({ statusCode: 400, statusMessage: 'Description requise.', message: 'La description doit contenir du texte ou une image.' });
    }
    if (richTextLength(sanitized) > 3000) {
      throw createError({ statusCode: 400, statusMessage: 'Texte trop long.', message: 'La description, le contexte et les résultats sont limités à 3 000 caractères visibles.' });
    }
    value[key] = key !== 'description' && isRichTextEmpty(sanitized) ? null : sanitized;
  }
}

async function validateTechnologyAiMetadata(value: TechnologyAiMetadata) {
  const hasAiMetadata = [value.aiType, value.aiProviderId, value.aiAccessMode, value.aiVerifiedAt, value.description, value.officialUrl]
    .some((field) => field != null) || Boolean(value.aiUseCases?.length);
  if (value.category !== 'IA' && hasAiMetadata) {
    throw createError({ statusCode: 400, statusMessage: 'Métadonnées IA incompatibles.', message: 'Les métadonnées IA ne peuvent être utilisées que pour une entrée de catégorie IA.' });
  }
  if (value.aiType === 'provider' && value.aiProviderId != null) {
    throw createError({ statusCode: 400, statusMessage: 'Fournisseur invalide.', message: 'Un fournisseur ne peut pas être lié à un autre fournisseur.' });
  }
  if (value.aiProviderId != null) {
    const [provider] = await getDatabase()
      .select({ category: technologies.category, aiType: technologies.aiType })
      .from(technologies)
      .where(eq(technologies.id, value.aiProviderId))
      .limit(1);
    if (!provider || provider.category !== 'IA' || provider.aiType !== 'provider') {
      throw createError({ statusCode: 400, statusMessage: 'Fournisseur invalide.', message: 'Choisis une entrée IA classée comme fournisseur.' });
    }
  }
}

export async function listResource(name: ResourceName) {
  const table:any = resourceTables[name]; return getDatabase().select().from(table).orderBy(asc(table.sortOrder));
}
async function recordActivity(action: string, resource: ResourceName, id: number | null, record: Record<string, unknown>, before: unknown = null) {
  const label = String(record.title || record.name || record.author || record.role || record.slug || `${resource} #${id ?? ''}`).slice(0, 180);
  await getDatabase().insert(activityLog).values({
    action, resource, resourceId: id, summary: `${action === 'create' ? 'Ajout' : action === 'update' ? 'Modification' : 'Suppression'} · ${label}`,
    before: before as object | null, after: action === 'delete' ? null : record,
  });
}
export async function createResource(name: ResourceName, body: unknown) {
  const parsed = contentSchemas[name].safeParse(body);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join('.')).filter(Boolean))];
    throw createError({ statusCode: 400, statusMessage: 'Contenu invalide.', message: fields.length ? `Vérifie les champs : ${fields.join(', ')}.` : 'Les données du contenu sont invalides.' });
  }
  const value = parsed.data; const table:any = resourceTables[name];
  if (name === 'projects') sanitizeProjectRichText(value);
  if (name === 'technologies') await validateTechnologyAiMetadata(value as TechnologyAiMetadata);
  const testimonialValue = value as { publicationStatus?: string; permissionConfirmed?: boolean };
  if (name === 'testimonials' && testimonialValue.publicationStatus === 'published' && !testimonialValue.permissionConfirmed) {
    throw createError({ statusCode: 400, statusMessage: 'Autorisation requise.', message: 'Confirme l’autorisation de publication avant de publier ce témoignage.' });
  }
  const [row] = await getDatabase().insert(table).values(value as any).returning();
  await recordActivity('create', name, row.id, row);
  return row;
}
export async function updateResource(name: ResourceName, id: number, body: unknown) {
  const parsed = contentSchemas[name].partial().safeParse(body);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join('.')).filter(Boolean))];
    throw createError({ statusCode: 400, statusMessage: 'Contenu invalide.', message: fields.length ? `Vérifie les champs : ${fields.join(', ')}.` : 'Les données du contenu sont invalides.' });
  }
  const value = parsed.data; if (!Object.keys(value).length) throw createError({ statusCode:400,statusMessage:'Aucune donnée à modifier.' });
  if (name === 'projects') sanitizeProjectRichText(value);
  const table:any=resourceTables[name]; const db=getDatabase();
  const [current] = await db.select().from(table).where(eq(table.id,id)).limit(1);
  if (!current) throw createError({statusCode:404,statusMessage:'Élément introuvable.'});
  const currentSnapshot = current as Record<string, unknown>;
  if (name === 'technologies') {
    const merged = { ...current, ...value } as TechnologyAiMetadata;
    await validateTechnologyAiMetadata(merged);
    if (current.aiType === 'provider' && merged.aiType !== 'provider') {
      const [linked] = await db.select({ id: technologies.id }).from(technologies).where(eq(technologies.aiProviderId,id)).limit(1);
      if (linked) throw createError({ statusCode: 400, statusMessage: 'Fournisseur encore utilisé.', message: 'Dissocie les modèles liés avant de changer le type de ce fournisseur.' });
    }
  }
  if (name === 'testimonials') {
    const merged = { ...current, ...value } as { publicationStatus: string; permissionConfirmed: boolean };
    if (merged.publicationStatus === 'published' && !merged.permissionConfirmed) {
      throw createError({ statusCode: 400, statusMessage: 'Autorisation requise.', message: 'Confirme l’autorisation de publication avant de publier ce témoignage.' });
    }
  }
  const [row]=await db.update(table).set(value as any).where(eq(table.id,id)).returning();
  if (!row) throw createError({statusCode:404,statusMessage:'Élément introuvable.'});
  await recordActivity('update', name, row.id, row, currentSnapshot);
  return row;
}
export async function deleteResource(name: ResourceName,id:number) {
  const table:any=resourceTables[name]; const db=getDatabase();
  const [current] = await db.select().from(table).where(eq(table.id,id)).limit(1);
  if (!current) throw createError({statusCode:404,statusMessage:'Élément introuvable.'});
  const rows=await db.delete(table).where(eq(table.id,id)).returning({id:table.id});
  if (!rows.length) throw createError({statusCode:404,statusMessage:'Élément introuvable.'});
  await recordActivity('delete', name, id, current, current);
  return {ok:true};
}
