import { test } from 'node:test';
import assert from 'node:assert/strict';
import { callCortexFunction } from './cortexClient.js';

test('callCortexFunction posts JSON with the api-key header to the right URL', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ ok: true, logs: [] }), { status: 200 });
  }) as typeof fetch;

  try {
    const result = await callCortexFunction('https://example.com', 'key-123', 'mcpGetRecentLogs', {
      limit: 10,
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://example.com/mcpGetRecentLogs');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal((calls[0].init.headers as Record<string, string>)['api-key'], 'key-123');
    assert.equal(calls[0].init.body, JSON.stringify({ limit: 10 }));
    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { ok: true, logs: [] });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('callCortexFunction surfaces non-2xx responses without throwing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: 'Invalid API key' }), { status: 401 })) as typeof fetch;

  try {
    const result = await callCortexFunction('https://example.com', 'bad-key', 'mcpListTasks', {});
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { error: 'Invalid API key' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
