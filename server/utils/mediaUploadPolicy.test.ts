import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMediaUploadPolicy } from './mediaUploadPolicy';

test('public evidence accepts valid PDF files only in the related content folders', () => {
  const pdf = new TextEncoder().encode('%PDF-1.7\n');
  assert.deepEqual(resolveMediaUploadPolicy('certifications', 'application/pdf', pdf), {
    kind: 'pdf',
    resourceType: 'raw',
    maxBytes: 10 * 1024 * 1024,
    allowedFormats: ['pdf'],
  });
  assert.throws(() => resolveMediaUploadPolicy('projects', 'application/pdf', pdf), /justificatifs PDF/u);
  assert.throws(() => resolveMediaUploadPolicy('journey', 'application/pdf', new TextEncoder().encode('not a pdf')), /PDF valide/u);
});

test('image uploads require a matching JPEG, PNG, or WebP signature', () => {
  assert.equal(resolveMediaUploadPolicy('educations', 'image/jpeg', Uint8Array.from([0xff, 0xd8, 0xff, 0x00])).kind, 'image');
  assert.equal(resolveMediaUploadPolicy('certifications', 'image/png', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).kind, 'image');
  assert.equal(resolveMediaUploadPolicy('journey', 'image/webp', new TextEncoder().encode('RIFF0000WEBP')).kind, 'image');
  assert.throws(() => resolveMediaUploadPolicy('projects', 'image/png', new TextEncoder().encode('not a png')), /valide/u);
});
