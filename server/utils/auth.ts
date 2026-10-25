import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { eq } from 'drizzle-orm';
import { createError, deleteCookie, getCookie, getHeader, getRequestURL, setCookie, type H3Event } from 'h3';
import { useRuntimeConfig } from '#imports';
import { getDatabase } from './database';
import { admins } from './schema';
import { normalizeAdminPermissions, resolveAdminPermission, SUPER_ADMIN_EMAIL } from '~/shared/adminPermissions';

const COOKIE = 'carrel_admin_session';
const CSRF_COOKIE = 'carrel_admin_csrf';
const lifetime = 60 * 60 * 12;
const setupLifetime = 60 * 10;

function sessionSecret() {
  const secret = String(useRuntimeConfig().sessionPassword || '');
  if (secret.length < 32) throw createError({ statusCode: 503, statusMessage: 'La clé NUXT_SESSION_PASSWORD doit être configurée avec au moins 32 caractères.' });
  return secret;
}

function signingKey() {
  return createHash('sha256').update(sessionSecret()).digest();
}

export async function createAdminSession(event: H3Event, adminId: number, email: string, setupPending = false, sessionVersion = 0) {
  const expiresIn = setupPending ? setupLifetime : lifetime;
  const token = await new SignJWT({ email, role: 'admin', mfa: setupPending ? 'setup' : 'verified', sessionVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(adminId))
    .setIssuer('carrelfolio')
    .setAudience('carrel-admin')
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(signingKey());
  const csrf = randomBytes(24).toString('hex');
  setCookie(event, COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: expiresIn });
  setCookie(event, CSRF_COOKIE, csrf, { httpOnly: false, secure: true, sameSite: 'lax', path: '/', maxAge: expiresIn });
}

export function clearAdminSession(event: H3Event) {
  deleteCookie(event, COOKIE, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  deleteCookie(event, CSRF_COOKIE, { httpOnly: false, secure: true, sameSite: 'lax', path: '/' });
}

async function getSession(event: H3Event) {
  const token = getCookie(event, COOKIE);
  if (!token) return null;
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, signingKey(), { issuer: 'carrelfolio', audience: 'carrel-admin' }));
  } catch {
    return null;
  }
  if (payload.role !== 'admin' || !payload.sub || !/^\d+$/u.test(payload.sub)) return null;
  const [admin] = await getDatabase()
    .select({
      id: admins.id,
      email: admins.email,
      role: admins.role,
      active: admins.active,
      permissions: admins.permissions,
      totpEnabled: admins.totpEnabled,
      sessionVersion: admins.sessionVersion,
    })
    .from(admins)
    .where(eq(admins.id, Number(payload.sub)))
    .limit(1);
  return admin?.active && payload.sessionVersion === admin.sessionVersion ? { admin, payload } : null;
}

function isSuperAdmin(admin: { email: string; role: string }) {
  return admin.role === 'super_admin' && admin.email.toLowerCase() === SUPER_ADMIN_EMAIL;
}

export async function getAdminSessionState(event: H3Event) {
  const session = await getSession(event);
  if (!session) return { authenticated: false, setupRequired: false };
  const authenticated = session.admin.totpEnabled && session.payload.mfa === 'verified';
  const setupRequired = !session.admin.totpEnabled && session.payload.mfa === 'setup';
  return {
    authenticated,
    setupRequired,
    ...(authenticated ? {
      email: session.admin.email,
      role: isSuperAdmin(session.admin) ? 'super_admin' : 'admin',
      isSuperAdmin: isSuperAdmin(session.admin),
      permissions: normalizeAdminPermissions(session.admin.permissions),
    } : {}),
  };
}

export async function getAdmin(event: H3Event) {
  const session = await getSession(event);
  if (!session?.admin.totpEnabled || session.payload.mfa !== 'verified') return null;
  return session.admin;
}

export function verifyAdminCsrf(event: H3Event) {
  const cookie = getCookie(event, CSRF_COOKIE) || '';
  const header = getHeader(event, 'x-admin-csrf') || '';
  const cookieBytes = Buffer.from(cookie);
  const headerBytes = Buffer.from(header);
  if (cookieBytes.length !== headerBytes.length || cookieBytes.length < 32 || !timingSafeEqual(cookieBytes, headerBytes)) {
    throw createError({ statusCode: 403, statusMessage: 'Jeton anti-CSRF absent ou invalide.' });
  }
}

async function getSetupSession(event: H3Event) {
  const session = await getSession(event);
  if (!session || session.admin.totpEnabled || session.payload.mfa !== 'setup') {
    throw createError({ statusCode: 401, statusMessage: 'Une vérification récente du mot de passe administrateur est requise.' });
  }
  return session.admin;
}

export async function requireAdminMfaSetup(event: H3Event) {
  const admin = await getSetupSession(event);
  verifyAdminCsrf(event);
  return admin;
}

export async function requireAdmin(event: H3Event) {
  const admin = await getAdmin(event);
  if (!admin) throw createError({ statusCode: 401, statusMessage: 'Session administrateur avec double authentification requise.' });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(event.method)) verifyAdminCsrf(event);
  if (!isSuperAdmin(admin)) {
    const permission = resolveAdminPermission(getRequestURL(event).pathname, event.method);
    if (!permission || normalizeAdminPermissions(admin.permissions)[permission] !== true) {
      throw createError({ statusCode: 403, statusMessage: 'Cette action n’est pas autorisée pour ce compte.' });
    }
  }
  return admin;
}

export async function requireSuperAdmin(event: H3Event) {
  const admin = await requireAdmin(event);
  if (!isSuperAdmin(admin)) throw createError({ statusCode: 403, statusMessage: 'Réservé au super-administrateur.' });
  return admin;
}

export function hashAdminLoginIp(ip: string) {
  return createHmac('sha256', sessionSecret()).update(ip).digest('hex');
}

export function getSessionSecretForTotp() {
  return sessionSecret();
}
