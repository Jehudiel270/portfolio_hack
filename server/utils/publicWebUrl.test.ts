import assert from 'node:assert/strict';
import test from 'node:test';
import { isNonPublicAddress } from './publicWebUrl';

test('public URL validation blocks private, local, and reserved IP ranges', () => {
  for (const address of [
    '0.0.0.0', '10.1.2.3', '100.64.0.1', '127.0.0.1', '169.254.169.254',
    '172.20.1.1', '192.0.2.10', '192.168.1.1', '198.18.0.1', '198.51.100.10',
    '203.0.113.8', '224.0.0.1', '::1', 'fc00::1', 'fd12::1', 'fe80::1',
    '2001:db8::1', '::ffff:127.0.0.1',
  ]) assert.equal(isNonPublicAddress(address), true, `${address} must not be used as a public URL`);
  assert.equal(isNonPublicAddress('8.8.8.8'), false);
  assert.equal(isNonPublicAddress('2606:4700:4700::1111'), false);
});
