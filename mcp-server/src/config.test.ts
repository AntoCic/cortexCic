import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from './config.js';

test('loadConfig reads CORTEX_API_KEY and CORTEX_FUNCTIONS_BASE_URL', () => {
  const config = loadConfig({
    CORTEX_API_KEY: 'key-123',
    CORTEX_FUNCTIONS_BASE_URL: 'https://example.com/',
  } as NodeJS.ProcessEnv);

  assert.equal(config.apiKey, 'key-123');
  assert.equal(config.functionsBaseUrl, 'https://example.com');
});

test('loadConfig throws when CORTEX_API_KEY is missing', () => {
  assert.throws(
    () => loadConfig({ CORTEX_FUNCTIONS_BASE_URL: 'https://example.com' } as NodeJS.ProcessEnv),
    /CORTEX_API_KEY/,
  );
});

test('loadConfig throws when CORTEX_FUNCTIONS_BASE_URL is missing', () => {
  assert.throws(
    () => loadConfig({ CORTEX_API_KEY: 'key-123' } as NodeJS.ProcessEnv),
    /CORTEX_FUNCTIONS_BASE_URL/,
  );
});
