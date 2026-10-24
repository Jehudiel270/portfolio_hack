import { defineEventHandler, getRouterParam, readBody } from 'h3';
import { requireAdmin } from '~/server/utils/auth';
import { createResource, getResource } from '~/server/utils/content';
export default defineEventHandler(async (event) => { await requireAdmin(event);const resource=getResource(getRouterParam(event,'collection')||'');return createResource(resource,await readBody(event)); });
