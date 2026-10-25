import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const totpStepSeconds = 30;
const totpDigits = 6;

export function generateTotpSecret() {
  const bytes = randomBytes(20);
  let bits = 0;
  let value = 0;
  let encoded = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      encoded += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits) encoded += base32Alphabet[(value << (5 - bits)) & 31];
  return encoded;
}

function decodeBase32(value: string) {
  const normalized = value.toUpperCase().replace(/=+$/u, '');
  let bits = 0;
  let buffer = 0;
  const bytes: number[] = [];
  for (const character of normalized) {
    const digit = base32Alphabet.indexOf(character);
    if (digit < 0) throw new Error('Invalid base32 TOTP secret.');
    buffer = (buffer << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function verifyTotp(secret: string, suppliedCode: string, now = Date.now()) {
  const code = suppliedCode.replace(/\s/gu, '');
  if (!/^\d{6}$/u.test(code)) return false;
  const key = decodeBase32(secret);
  const counter = Math.floor(now / 1000 / totpStepSeconds);
  for (let offset = -1; offset <= 1; offset++) {
    const message = Buffer.alloc(8);
    message.writeBigUInt64BE(BigInt(counter + offset));
    const digest = createHmac('sha1', key).update(message).digest();
    const index = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[index] & 0x7f) << 24)
      | ((digest[index + 1] & 0xff) << 16)
      | ((digest[index + 2] & 0xff) << 8)
      | (digest[index + 3] & 0xff);
    const expected = String(binary % (10 ** totpDigits)).padStart(totpDigits, '0');
    const expectedBytes = Buffer.from(expected);
    const suppliedBytes = Buffer.from(code);
    if (timingSafeEqual(expectedBytes, suppliedBytes)) return true;
  }
  return false;
}

export function createTotpUri(email: string, secret: string) {
  const issuer = 'Carrelfolio Admin';
  const label = `${issuer}:${email}`;
  const query = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(totpDigits), period: String(totpStepSeconds) });
  return `otpauth://totp/${encodeURIComponent(label)}?${query.toString()}`;
}

function encryptionKey(sessionSecret: string) {
  return createHash('sha256').update('carrelfolio:admin-totp-encryption:v1:').update(sessionSecret).digest();
}

export function encryptTotpSecret(secret: string, sessionSecret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(sessionSecret), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}

export function decryptTotpSecret(ciphertext: string, sessionSecret: string) {
  const [ivValue, tagValue, encryptedValue, extra] = ciphertext.split('.');
  if (!ivValue || !tagValue || !encryptedValue || extra) throw new Error('Invalid encrypted TOTP secret.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(sessionSecret), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
}

export function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => randomBytes(12).toString('base64url').toUpperCase());
}

export function hashRecoveryCode(code: string) {
  return createHash('sha256').update(code.toUpperCase().replace(/[-\s]/gu, '')).digest('hex');
}
