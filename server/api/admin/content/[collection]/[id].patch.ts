import { createError, defineEventHandler, getRouterParam, readBody } from 'h3';
import { requireAdmin } from '~/server/utils/auth';
import { getResource, updateResource } from '~/server/utils/content';
export default defineEventHandler(async (event) => { await requireAdmin(event);const resource=getResource(getRouterParam(event,'collection')||'');const id=Number(getRouterParam(event,'id'));if(!Number.isSafeInteger(id)||id<1)throw createError({statusCode:400,statusMessage:'Identifiant invalide.'});return updateResource(resource,id,await readBody(event)); });
