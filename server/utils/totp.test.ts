import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTotpUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotp,
} from './totp';

test('verifies the RFC 6238 SHA-1 six-digit test vector', () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(verifyTotp(secret, '287082', 59_000), true);
  assert.equal(verifyTotp(secret, '287083', 59_000), false);
});

test('accepts adjacent time steps but rejects malformed codes', () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(verifyTotp(secret, '287082', 89_000), true);
  assert.equal(verifyTotp(secret, '12 3456', 59_000), false);
});

test('encrypts TOTP secrets and authenticates ciphertext', () => {
  const ciphertext = encryptTotpSecret('ABCDEFGHIJKLMNOP', 'a'.repeat(48));
  assert.equal(decryptTotpSecret(ciphertext, 'a'.repeat(48)), 'ABCDEFGHIJKLMNOP');
  assert.throws(() => decryptTotpSecret(ciphertext, 'b'.repeat(48)));
});

test('creates unique authenticator secrets and recovery codes', () => {
  const first = generateTotpSecret();
  const second = generateTotpSecret();
  const recoveryCodes = generateRecoveryCodes();
  assert.notEqual(first, second);
  assert.equal(recoveryCodes.length, 10);
  assert.equal(new Set(recoveryCodes).size, 10);
  assert.equal(hashRecoveryCode(recoveryCodes[0]), hashRecoveryCode(recoveryCodes[0].toLowerCase()));
  assert.match(createTotpUri('owner@example.com', first), /^otpauth:\/\/totp\//u);
});
