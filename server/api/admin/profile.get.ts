import { createError, defineEventHandler } from 'h3';
import { getDatabase } from '~/server/utils/database';
import { requireAdmin } from '~/server/utils/auth';
import { profiles } from '~/server/utils/schema';
import { resolveSocialLinks } from '~/composables/socialNetworks';
export default defineEventHandler(async(event)=>{await requireAdmin(event);const [profile]=await getDatabase().select().from(profiles).limit(1);if(!profile)throw createError({statusCode:404,statusMessage:'Profil non initialisé. Lance le bootstrap administrateur une première fois.'});return {...profile,socialLinks:resolveSocialLinks(profile.socialLinks,profile)};});
