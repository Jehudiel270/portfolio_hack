import { createError, defineEventHandler, getRequestIP, readBody } from 'h3';
import { useRuntimeConfig } from '#imports';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createAdminSession } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { admins } from '~/server/utils/schema';

const attempts = new Map<string, { count: number; since: number }>();
export default defineEventHandler(async (event) => {
  const config=useRuntimeConfig();
  if(String(config.sessionPassword||'').length<32)throw createError({statusCode:503,statusMessage:'Configuration de session incomplète. La connexion administrateur est désactivée.'});
  const ip=getRequestIP(event,{xForwardedFor:true})||'unknown';const now=Date.now();const previous=attempts.get(ip);
  if(previous&&now-previous.since<15*60_000&&previous.count>=8)throw createError({statusCode:429,statusMessage:'Trop de tentatives. Réessaie dans quelques minutes.'});
  if(!previous||now-previous.since>=15*60_000)attempts.set(ip,{count:0,since:now});
  const input=z.object({email:z.string().trim().email().max(320),password:z.string().min(8).max(256)}).safeParse(await readBody(event));
  if(!input.success)throw createError({statusCode:400,statusMessage:'Adresse e-mail ou mot de passe invalide.'});
  const db=getDatabase();const [admin]=await db.select().from(admins).where(eq(admins.email,input.data.email.toLowerCase())).limit(1);
  if(!admin||!(await bcrypt.compare(input.data.password,admin.passwordHash))){const count=(attempts.get(ip)?.count||0)+1;attempts.set(ip,{count,since:attempts.get(ip)?.since||now});throw createError({statusCode:401,statusMessage:'Connexion refusée. Vérifie tes identifiants.'});}
  attempts.delete(ip);await createAdminSession(event,admin.id,admin.email);return{authenticated:true,email:admin.email};
});
