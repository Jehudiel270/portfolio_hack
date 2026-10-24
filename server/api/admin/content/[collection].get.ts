import { defineEventHandler, getRouterParam } from 'h3';
import { requireAdmin } from '~/server/utils/auth';
import { getResource, listResource } from '~/server/utils/content';
export default defineEventHandler(async (event) => { await requireAdmin(event);const resource=getResource(getRouterParam(event,'collection')||'');return listResource(resource); });
