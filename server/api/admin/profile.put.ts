import { createError, defineEventHandler, readBody } from 'h3';
import { z } from 'zod';
import { requireAdmin } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { profiles } from '~/server/utils/schema';
import { socialNetworkIds, type SocialLink } from '~/composables/socialNetworks';
const socialLinkSchema=z.object({platform:z.custom<SocialLink['platform']>((platform):platform is SocialLink['platform']=>typeof platform==='string'&&(socialNetworkIds.some(id=>id===platform)||platform.startsWith('custom:'))),url:z.string().trim().url().max(500),customLabel:z.string().trim().max(80).optional(),customIcon:z.string().max(120).optional()}).refine(link=>!link.platform.startsWith('custom:')||!!link.customLabel,{message:'Choisis un réseau reconnu ou indique un nom pour le lien personnalisé.'});
const profileInput=z.object({name:z.string().trim().min(1).max(120),role:z.string().trim().min(1).max(180),location:z.string().max(120),education:z.string().max(180),bio:z.string().max(3000),avatarUrl:z.union([z.string().url().max(1200),z.literal(''),z.null()]),email:z.union([z.string().email().max(320),z.literal(''),z.null()]),githubUrl:z.union([z.string().url().max(500),z.literal(''),z.null()]),linkedinUrl:z.union([z.string().url().max(500),z.literal(''),z.null()]),socialLinks:z.array(socialLinkSchema).max(30),available:z.boolean()});
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);
  const parsed=profileInput.safeParse(await readBody(event));
  if(!parsed.success){
    const fields=[...new Set(parsed.error.issues.map(issue=>issue.path.join('.')).filter(Boolean))];
    throw createError({statusCode:400,statusMessage:fields.length?`Profil invalide. Vérifie les champs : ${fields.join(', ')}.`:'Les données du profil sont invalides.'});
  }
  const v=parsed.data;
  const fields={...v,avatarUrl:v.avatarUrl||null,email:v.email||null,githubUrl:v.socialLinks.find(link=>link.platform==='github')?.url||null,linkedinUrl:v.socialLinks.find(link=>link.platform==='linkedin')?.url||null,updatedAt:new Date()};
  try{
    const [profile]=await getDatabase().insert(profiles).values({id:1,...fields}).onConflictDoUpdate({target:profiles.id,set:fields}).returning();
    if(!profile)throw new Error('Profile upsert returned no row');
    return profile;
  }catch(error){
    console.error('[Admin] Profile save failed.',error);
    throw createError({statusCode:503,statusMessage:'Le profil n’a pas été enregistré : la base de données a refusé la mise à jour. Réessaie dans un instant.'});
  }
});
