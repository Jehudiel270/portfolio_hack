import assert from 'node:assert/strict';
import test from 'node:test';
import { AI_TEXT_PROVIDERS } from '../../shared/adminAi';
import { buildScreenshotRequest, MAX_SITE_CAPTURE_BYTES } from './siteCapture';

test('site captures use a fixed desktop viewport and a direct JPEG response', () => {
  assert.deepEqual(buildScreenshotRequest('https://example.com/demo', 'desktop'), {
    url: 'https://example.com/demo',
    format: 'jpeg',
    response_type: 'by_format',
    viewport_width: 1440,
    viewport_height: 900,
    full_page: false,
    wait_until: ['load'],
  });
});

test('site captures support a mobile viewport and opt-in full-page rendering', () => {
  const mobile = buildScreenshotRequest('https://example.com/demo', 'mobile');
  assert.equal(mobile.viewport_width, 390);
  assert.equal(mobile.viewport_height, 844);
  assert.equal(mobile.full_page, false);

  const fullPage = buildScreenshotRequest('https://example.com/demo', 'fullpage');
  assert.equal(fullPage.viewport_width, 1440);
  assert.equal(fullPage.full_page, true);
});

test('site capture response limit remains below serverless payload limits', () => {
  assert.equal(MAX_SITE_CAPTURE_BYTES, 4 * 1024 * 1024);
});

test('capture service is not exposed as a text-generation provider', () => {
  assert.deepEqual([...AI_TEXT_PROVIDERS], ['gemini', 'openai', 'anthropic', 'mistral', 'deepseek']);
});
