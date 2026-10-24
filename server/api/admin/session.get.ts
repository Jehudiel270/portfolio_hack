import { defineEventHandler } from 'h3';
import { getAdmin } from '~/server/utils/auth';
export default defineEventHandler(async (event) => ({ authenticated: Boolean(await getAdmin(event)) }));
