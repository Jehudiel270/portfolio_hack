import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL || '';
const email = (process.env.ADMIN_MFA_RESET_EMAIL || '').trim().toLowerCase();
const confirmation = (process.env.ADMIN_MFA_RESET_CONFIRM || '').trim().toLowerCase();

if (!databaseUrl) throw new Error('DATABASE_URL doit être configurée.');
if (!email || confirmation !== email) {
  throw new Error('Pour confirmer la réinitialisation, définis ADMIN_MFA_RESET_EMAIL et ADMIN_MFA_RESET_CONFIRM avec la même adresse admin.');
}

const sql = postgres(databaseUrl, { ssl: 'require', max: 1, connect_timeout: 10, prepare: false });
try {
  const result = await sql`
    UPDATE portfolio_admins
    SET totp_enabled = false,
        totp_secret_ciphertext = NULL,
        recovery_code_hashes = '[]'::jsonb
    WHERE lower(email) = ${email}
    RETURNING id
  `;
  if (!result.length) throw new Error('Aucun administrateur ne correspond à cette adresse.');
  console.log('Double authentification réinitialisée. La prochaine connexion par mot de passe imposera une nouvelle inscription TOTP.');
} finally {
  await sql.end({ timeout: 5 });
}
