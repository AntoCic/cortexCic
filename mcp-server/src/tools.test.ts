import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTools, toToolResult } from './tools.js';

test('toToolResult formats a successful response as pretty-printed JSON text', () => {
  const result = toToolResult({ ok: true, status: 200, body: { logs: [{ id: '1' }] } });
  assert.equal(result.isError, undefined);
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].type, 'text');
  assert.equal(result.content[0].text, JSON.stringify({ logs: [{ id: '1' }] }, null, 2));
});

test('toToolResult formats an error response with isError true', () => {
  const result = toToolResult({ ok: false, status: 401, body: { error: 'Invalid API key' } });
  assert.equal(result.isError, true);
  assert.equal(result.content[0].text, 'Invalid API key');
});

test('toToolResult falls back to a generic message when body has no error field', () => {
  const result = toToolResult({ ok: false, status: 500, body: {} });
  assert.equal(result.isError, true);
  assert.equal(result.content[0].text, 'Request failed with status 500');
});

test('buildTools exposes exactly the 4 expected tools', () => {
  const tools = buildTools({ apiKey: 'key-123', functionsBaseUrl: 'https://example.com' });
  assert.deepEqual(
    tools.map((t) => t.name),
    ['get_recent_logs', 'create_task', 'list_tasks', 'update_task_status'],
  );
});

test('create_task handler posts to the mcpCreateTask endpoint with the given args', async () => {
  const calls: { url: string }[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    calls.push({ url });
    return new Response(JSON.stringify({ ok: true, taskId: 'abc' }), { status: 200 });
  }) as typeof fetch;

  try {
    const tools = buildTools({ apiKey: 'key-123', functionsBaseUrl: 'https://example.com' });
    const createTask = tools.find((t) => t.name === 'create_task')!;
    const result = await createTask.handler({ title: 'Test task' });

    assert.equal(calls[0].url, 'https://example.com/mcpCreateTask');
    assert.equal(result.isError, undefined);
    assert.equal(result.content[0].text, JSON.stringify({ ok: true, taskId: 'abc' }, null, 2));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
