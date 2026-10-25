import { createError, defineEventHandler, readBody } from 'h3';
import { useRuntimeConfig } from '#imports';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createAdminSession, getSessionSecretForTotp } from '~/server/utils/auth';
import { clearAdminAuthAttempts, registerAdminAuthAttempt } from '~/server/utils/adminRateLimit';
import { decryptTotpSecret, hashRecoveryCode, verifyTotp } from '~/server/utils/totp';
import { getDatabase } from '~/server/utils/database';
import { admins } from '~/server/utils/schema';

async function consumeRecoveryCode(adminId: number, code: string) {
  const db = getDatabase();
  return db.transaction(async (transaction) => {
    const [admin] = await transaction.select({ recoveryCodeHashes: admins.recoveryCodeHashes })
      .from(admins)
      .where(eq(admins.id, adminId))
      .for('update');
    if (!admin) return false;
    const digest = hashRecoveryCode(code);
    const index = admin.recoveryCodeHashes.indexOf(digest);
    if (index < 0) return false;
    const remaining = admin.recoveryCodeHashes.filter((_, codeIndex) => codeIndex !== index);
    await transaction.update(admins).set({ recoveryCodeHashes: remaining }).where(eq(admins.id, adminId));
    return true;
  });
}

export default defineEventHandler(async (event) => {
  if (String(useRuntimeConfig().sessionPassword || '').length < 32) {
    throw createError({ statusCode: 503, statusMessage: 'Configuration de session incomplète. La connexion administrateur est désactivée.' });
  }

  const input = z.object({
    email: z.string().trim().email().max(320),
    password: z.string().min(8).max(256),
    otp: z.string().max(64).optional(),
  }).safeParse(await readBody(event));
  if (!input.success) throw createError({ statusCode: 400, statusMessage: 'Adresse e-mail ou mot de passe invalide.' });

  const ipHash = await registerAdminAuthAttempt(event);

  const db = getDatabase();
  const [admin] = await db.select().from(admins).where(eq(admins.email, input.data.email.toLowerCase())).limit(1);
  if (!admin?.active || !(await bcrypt.compare(input.data.password, admin.passwordHash))) {
    throw createError({ statusCode: 401, statusMessage: 'Connexion refusée. Vérifie tes identifiants et ton code de sécurité.' });
  }

  if (admin.totpEnabled) {
    const otp = input.data.otp || '';
    let verified = false;
    if (admin.totpSecretCiphertext) {
      try {
        verified = verifyTotp(decryptTotpSecret(admin.totpSecretCiphertext, getSessionSecretForTotp()), otp);
      } catch (error) {
        console.error('[Admin MFA] Could not decrypt the configured TOTP secret.', error);
        throw createError({ statusCode: 503, statusMessage: 'La vérification à deux facteurs est momentanément indisponible.' });
      }
    }
    if (!verified && otp) verified = await consumeRecoveryCode(admin.id, otp);
    if (!verified) {
      throw createError({ statusCode: 401, statusMessage: 'Connexion refusée. Vérifie tes identifiants et ton code de sécurité.' });
    }
  }

  await clearAdminAuthAttempts(ipHash);
  const setupPending = !admin.totpEnabled;
  await createAdminSession(event, admin.id, admin.email, setupPending, admin.sessionVersion);
  return { authenticated: !setupPending, setupRequired: setupPending, email: admin.email };
});
