import { createError, defineEventHandler, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createAdminSession, getSessionSecretForTotp, requireAdminMfaSetup } from '~/server/utils/auth';
import { clearAdminAuthAttempts, registerAdminAuthAttempt } from '~/server/utils/adminRateLimit';
import { getDatabase } from '~/server/utils/database';
import { admins } from '~/server/utils/schema';
import { decryptTotpSecret, generateRecoveryCodes, hashRecoveryCode, verifyTotp } from '~/server/utils/totp';

export default defineEventHandler(async (event) => {
  const admin = await requireAdminMfaSetup(event);
  const ipHash = await registerAdminAuthAttempt(event);
  const input = z.object({ code: z.string().trim().regex(/^\d{6}$/u) }).safeParse(await readBody(event));
  if (!input.success) throw createError({ statusCode: 400, statusMessage: 'Saisis le code à six chiffres de ton application d’authentification.' });

  const db = getDatabase();
  const [record] = await db.select({ email: admins.email, totpSecretCiphertext: admins.totpSecretCiphertext, totpEnabled: admins.totpEnabled })
    .from(admins)
    .where(eq(admins.id, admin.id))
    .limit(1);
  if (!record || record.totpEnabled || !record.totpSecretCiphertext) {
    throw createError({ statusCode: 409, statusMessage: 'La configuration de sécurité a changé. Reconnecte-toi.' });
  }

  let verified: boolean;
  try {
    const secret = decryptTotpSecret(record.totpSecretCiphertext, getSessionSecretForTotp());
    verified = verifyTotp(secret, input.data.code);
  } catch (error) {
    console.error('[Admin MFA] Could not verify the pending TOTP setup.', error);
    throw createError({ statusCode: 503, statusMessage: 'La vérification à deux facteurs est momentanément indisponible.' });
  }
  if (!verified) throw createError({ statusCode: 401, statusMessage: 'Code invalide ou expiré. Vérifie l’heure de ton téléphone et réessaie.' });

  const recoveryCodes = generateRecoveryCodes();
  await db.update(admins).set({
    totpEnabled: true,
    recoveryCodeHashes: recoveryCodes.map(hashRecoveryCode),
  }).where(eq(admins.id, admin.id));
  await clearAdminAuthAttempts(ipHash);
  await createAdminSession(event, admin.id, record.email);
  return { authenticated: true, recoveryCodes };
});
