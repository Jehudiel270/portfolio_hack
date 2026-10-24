import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { createError, deleteCookie, getCookie, getHeader, setCookie, type H3Event } from 'h3';
import { useRuntimeConfig } from '#imports';
import { getDatabase } from './database';
import { admins } from './schema';

const COOKIE = 'carrel_admin_session';
const CSRF_COOKIE = 'carrel_admin_csrf';
const lifetime = 60 * 60 * 12;
function signingKey() {
  const secret = String(useRuntimeConfig().sessionPassword || '');
  if (secret.length < 32) throw createError({ statusCode: 503, statusMessage: 'La clé NUXT_SESSION_PASSWORD doit être configurée avec au moins 32 caractères.' });
  return createHash('sha256').update(secret).digest();
}
export async function createAdminSession(event: H3Event, adminId: number, email: string) {
  const token = await new SignJWT({ email, role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setSubject(String(adminId)).setIssuer('carrelfolio').setAudience('carrel-admin').setIssuedAt().setExpirationTime(`${lifetime}s`).sign(signingKey());
  const csrf = randomBytes(24).toString('hex');
  setCookie(event, COOKIE, token, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: lifetime });
  setCookie(event, CSRF_COOKIE, csrf, { httpOnly: false, secure: true, sameSite: 'none', path: '/', maxAge: lifetime });
}
export function clearAdminSession(event: H3Event) { deleteCookie(event, COOKIE, { httpOnly: true, secure: true, sameSite: 'none', path: '/' }); deleteCookie(event, CSRF_COOKIE, { httpOnly: false, secure: true, sameSite: 'none', path: '/' }); }
export async function getAdmin(event: H3Event) {
  const token = getCookie(event, COOKIE); if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { issuer: 'carrelfolio', audience: 'carrel-admin' });
    if (payload.role !== 'admin' || !payload.sub || !/^\d+$/.test(payload.sub)) return null;
    const db = getDatabase(); const [admin] = await db.select({ id: admins.id, email: admins.email }).from(admins).where(eq(admins.id, Number(payload.sub))).limit(1);
    return admin || null;
  } catch { return null; }
}
export async function requireAdmin(event: H3Event) {
  const admin = await getAdmin(event);
  if (!admin) throw createError({ statusCode: 401, statusMessage: 'Session administrateur requise.' });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(event.method)) {
    const cookie = getCookie(event, CSRF_COOKIE) || '';
    const header = getHeader(event, 'x-admin-csrf') || '';
    const a = Buffer.from(cookie); const b = Buffer.from(header);
    if (a.length !== b.length || a.length < 32 || !timingSafeEqual(a, b)) throw createError({ statusCode: 403, statusMessage: 'Jeton anti-CSRF absent ou invalide.' });
  }
  return admin;
}
