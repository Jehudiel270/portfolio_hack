import { createError, defineEventHandler } from 'h3';
import { eq } from 'drizzle-orm';
import { requireAdminMfaSetup, getSessionSecretForTotp } from '~/server/utils/auth';
import { getDatabase } from '~/server/utils/database';
import { admins } from '~/server/utils/schema';
import { createTotpUri, decryptTotpSecret, encryptTotpSecret, generateTotpSecret } from '~/server/utils/totp';

export default defineEventHandler(async (event) => {
  const admin = await requireAdminMfaSetup(event);
  const db = getDatabase();
  const [record] = await db.select({ email: admins.email, totpEnabled: admins.totpEnabled, totpSecretCiphertext: admins.totpSecretCiphertext })
    .from(admins)
    .where(eq(admins.id, admin.id))
    .limit(1);
  if (!record || record.totpEnabled) {
    throw createError({ statusCode: 409, statusMessage: 'La configuration de sécurité a déjà changé. Reconnecte-toi.' });
  }

  const encryptedSecret = record.totpSecretCiphertext || encryptTotpSecret(generateTotpSecret(), getSessionSecretForTotp());
  if (!record.totpSecretCiphertext) {
    await db.update(admins).set({ totpSecretCiphertext: encryptedSecret }).where(eq(admins.id, admin.id));
  }
  const secret = decryptTotpSecret(encryptedSecret, getSessionSecretForTotp());
  return { secret, uri: createTotpUri(record.email, secret) };
});
