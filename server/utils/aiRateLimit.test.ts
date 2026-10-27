import assert from 'node:assert/strict';
import test from 'node:test';
import { enforceAiRequestLimit } from './aiRateLimit';

test('AI request limits are isolated by admin and action', () => {
  const adminId = Math.floor(Math.random() * 1_000_000_000) + 1;
  enforceAiRequestLimit(adminId, 'draft', 1);
  enforceAiRequestLimit(adminId, 'image', 1);
  enforceAiRequestLimit(adminId + 1, 'draft', 1);
  assert.throws(() => enforceAiRequestLimit(adminId, 'draft', 1), /Limite atteinte/u);
});
