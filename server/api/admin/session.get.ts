import { defineEventHandler } from 'h3';
import { getAdminSessionState } from '~/server/utils/auth';
export default defineEventHandler(getAdminSessionState);
