import { defineEventHandler } from 'h3';
import { clearAdminSession } from '~/server/utils/auth';
export default defineEventHandler((event) => { clearAdminSession(event); return { ok: true }; });
