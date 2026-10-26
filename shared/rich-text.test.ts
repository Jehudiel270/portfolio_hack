import assert from 'node:assert/strict';
import test from 'node:test';
import { richTextLength, sanitizeHtml, toSafeHtml } from './rich-text';

test('sanitizes rich text markup and dangerous attributes', () => {
  const html = sanitizeHtml('<p>Safe</p><script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)">link</a>');

  assert.match(html, /Safe/);
  assert.match(html, /link/);
  assert.doesNotMatch(html, /<script|onerror|javascript:|alert\(/i);
});

test('supports plain text and counts visible characters without markup', () => {
  assert.match(toSafeHtml('First paragraph\n\nSecond paragraph'), /<p>First paragraph<\/p><p>Second paragraph<\/p>/);
  assert.equal(richTextLength('<p>Score <strong>98</strong></p>'), 8);
});
