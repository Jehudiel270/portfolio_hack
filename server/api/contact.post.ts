import { createError, defineEventHandler, getRequestIP, readBody } from 'h3';
import { useRuntimeConfig } from '#imports';
import * as nodemailer from 'nodemailer';
import { eq } from 'drizzle-orm';
import { getDatabase } from '~/server/utils/database';
import { contactMessages, profiles } from '~/server/utils/schema';
import { contactInputSchema } from '~/server/utils/contactValidation';
const recent=new Map<string,number[]>();
export default defineEventHandler(async(event)=>{
  const ip=getRequestIP(event,{xForwardedFor:true})||'unknown';const now=Date.now();const sent=(recent.get(ip)||[]).filter(t=>now-t<60*60_000);if(sent.length>=5)throw createError({statusCode:429,statusMessage:'Trop de messages envoyés. Réessaie dans une heure.'});
  const parsed=contactInputSchema.safeParse(await readBody(event));if(!parsed.success)throw createError({statusCode:400,statusMessage:'Vérifie les champs du formulaire puis réessaie.'});recent.set(ip,[...sent,now]);
  const config=useRuntimeConfig();const db=getDatabase();const [profile]=await db.select({email:profiles.email}).from(profiles).where(eq(profiles.id,1)).limit(1);const recipient=profile?.email||config.contactFallbackTo;
  const [saved]=await db.insert(contactMessages).values({...parsed.data,deliveryStatus:'received'}).returning({id:contactMessages.id});
  if(!config.smtpHost||!config.smtpPort||!config.smtpUser||!config.smtpPassword||!config.smtpFrom||!recipient){await db.update(contactMessages).set({deliveryStatus:'not_sent'}).where(eq(contactMessages.id,saved.id));throw createError({statusCode:503,statusMessage:'Ton message a été conservé dans la console du propriétaire, mais l’e-mail n’a pas été envoyé : le service SMTP ou son destinataire n’est pas configuré.'});}
  try{const port=Number(config.smtpPort);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('SMTP port misconfigured');const secure=String(config.smtpSecure)==='true';const transport=nodemailer.createTransport({host:String(config.smtpHost),port,secure,requireTLS:!secure&&port===587,auth:{user:String(config.smtpUser),pass:String(config.smtpPassword)},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});await transport.sendMail({from:String(config.smtpFrom),to:String(recipient),replyTo:parsed.data.email,subject:`Portfolio · ${parsed.data.subject||`Nouveau message de ${parsed.data.name}`}`,text:`De : ${parsed.data.name} <${parsed.data.email}>\nSujet : ${parsed.data.subject||'(sans sujet)'}\n\n${parsed.data.message}`});await db.update(contactMessages).set({deliveryStatus:'sent'}).where(eq(contactMessages.id,saved.id));return{ok:true,message:'Message envoyé. Merci, je te répondrai dès que possible.'};}
  catch{await db.update(contactMessages).set({deliveryStatus:'failed'}).where(eq(contactMessages.id,saved.id));console.error('[Contact] SMTP delivery failed; message retained in owner inbox.');throw createError({statusCode:502,statusMessage:'Ton message a été conservé dans la console du propriétaire, mais le serveur SMTP n’a pas accepté l’envoi. Tu peux réessayer plus tard.'});}
});
