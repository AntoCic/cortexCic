# cortexCic MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local MCP server that lets an AI coding assistant read recent cortexCic logs and manage tasks for one project, backed by 4 new apiKey-scoped Cloud Functions.

**Architecture:** 4 new `onRequest` Cloud Functions in `functions/src/mcp/` (same pattern as `functions/src/notifications/receiveNotification.ts`) resolve the calling project from an `api-key` header and perform the Firestore operation scoped to that project. A new standalone Node/TS package at `mcp-server/` wraps those 4 endpoints as MCP tools over stdio, using `@modelcontextprotocol/sdk`.

**Tech Stack:** TypeScript, `firebase-admin` / `firebase-functions/v2/https` (functions side), `@modelcontextprotocol/sdk` + `zod` (mcp-server side), Node's built-in `node:test` runner via `tsx` for the mcp-server's automated tests, manual `curl` against the Firebase emulator for the Cloud Functions (this repo has no existing automated test setup for `functions/`, so curl-based manual verification follows the established pattern from `notify.ts`).

## Global Constraints

- Region for all Cloud Functions: `europe-west1` (from `functions/src/config/config.ts`, applied repo-wide via `setGlobalOptions`).
- Firebase project id: `cortex-cic` (from `.firebaserc`).
- All new Cloud Functions follow the `notify.ts` auth pattern: read `api-key` from `req.headers['api-key']`, look up the project via `db.collection('projects').where('apiKey', '==', apiKey).limit(1).get()`, return `401` if missing/invalid.
- All new Cloud Functions are `POST`-only, returning `405` for any other method.
- Task status values: `'todo' | 'inprogress' | 'done' | 'block'` (from `src/enums/TaskStatus.ts`).
- Log/notification type values: `'info' | 'error' | 'warning' | 'deploy'` (from `functions/src/notifications/projectNotifications.ts`'s `PROJECT_NOTIFICATION_TYPES`).
- The `mcp-server/` package is independent of the Vite app and of `functions/` — its own `package.json`, its own `node_modules`. Its build output goes to `mcp-server/dist/` so the existing root `.gitignore` rule for `dist` already covers it (no `.gitignore` changes needed).
- Manual Cloud Function verification happens against the **Firebase emulator** (`npm start` at repo root, functions emulator on port `5001` per `firebase.json`), not production — consistent with this repo's existing dev workflow. Deploying to production (`firebase deploy --only functions`) is the final task and **requires explicit user confirmation before running**.

---

## Part A — Cloud Functions (`functions/`)

### Task 1: Shared MCP helpers + `mcpGetRecentLogs` endpoint

**Files:**
- Create: `functions/src/mcp/resolveProjectByApiKey.ts`
- Create: `functions/src/mcp/taskStatus.ts`
- Create: `functions/src/mcp/mcpGetRecentLogs.ts`
- Modify: `functions/src/index.ts`

**Interfaces:**
- Produces: `resolveProjectByApiKey(db: admin.firestore.Firestore, apiKey: string): Promise<{ projectId: string; projectData: admin.firestore.DocumentData } | null>` — used by every task in Part A.
- Produces: `TASK_STATUSES: readonly ['todo', 'inprogress', 'done', 'block']` and `type TaskStatusValue` — used by Tasks 2-4.
- Produces: `MCP_CREATED_BY_UID = 'mcp-api'` constant — used by Tasks 3-4 to stamp `createdByUid`/`updatedByUid` on writes made through the MCP.

- [ ] **Step 1: Create the shared apiKey-resolution helper**

`functions/src/mcp/resolveProjectByApiKey.ts`:

```ts
import * as admin from 'firebase-admin';

export interface ResolvedProject {
  projectId: string;
  projectData: admin.firestore.DocumentData;
}

export async function resolveProjectByApiKey(
  db: admin.firestore.Firestore,
  apiKey: string,
): Promise<ResolvedProject | null> {
  const snap = await db.collection('projects').where('apiKey', '==', apiKey).limit(1).get();
  if (snap.empty) return null;

  const projectDoc = snap.docs[0];
  return { projectId: projectDoc.id, projectData: projectDoc.data() };
}
```

- [ ] **Step 2: Create the shared task-status constants**

`functions/src/mcp/taskStatus.ts`:

```ts
export const TASK_STATUSES = ['todo', 'inprogress', 'done', 'block'] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const MCP_CREATED_BY_UID = 'mcp-api';
```

- [ ] **Step 3: Create the `mcpGetRecentLogs` Cloud Function**

`functions/src/mcp/mcpGetRecentLogs.ts`:

```ts
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { resolveProjectByApiKey } from './resolveProjectByApiKey';

const LOG_TYPES = ['info', 'error', 'warning', 'deploy'] as const;
type LogType = (typeof LOG_TYPES)[number];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const FETCH_WINDOW = 200;

export const mcpGetRecentLogs = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = req.headers['api-key'] as string | undefined;
  if (!apiKey || typeof apiKey !== 'string') {
    res.status(401).json({ error: 'Missing API key' });
    return;
  }

  const db = admin.firestore();
  const resolved = await resolveProjectByApiKey(db, apiKey);
  if (!resolved) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  const { type, limit } = req.body as { type?: unknown; limit?: unknown };

  if (type !== undefined && !LOG_TYPES.includes(type as LogType)) {
    res.status(400).json({ error: `type must be one of: ${LOG_TYPES.join(', ')}` });
    return;
  }

  let resolvedLimit = DEFAULT_LIMIT;
  if (limit !== undefined) {
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      res.status(400).json({ error: `limit must be an integer between 1 and ${MAX_LIMIT}` });
      return;
    }
    resolvedLimit = limit;
  }

  const snap = await db
    .collection('projects')
    .doc(resolved.projectId)
    .collection('notifications')
    .orderBy('createdAt', 'desc')
    .limit(FETCH_WINDOW)
    .get();

  let docs = snap.docs;
  if (type !== undefined) {
    docs = docs.filter((d) => d.data().type === type);
  }
  docs = docs.slice(0, resolvedLimit);

  const logs = docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt as admin.firestore.Timestamp | undefined;
    return {
      id: d.id,
      type: data.type,
      message: data.message,
      payload: data.payload ?? null,
      createdAt: createdAt ? createdAt.toDate().toISOString() : null,
    };
  });

  res.status(200).json({ logs });
});
```

Note: filtering by `type` happens in-memory over the latest `FETCH_WINDOW` (200) log entries rather than via a Firestore composite index, to avoid requiring a new index deploy for v1. This is fine at the log volumes a single project produces; revisit only if a project's log volume grows enough that 200 entries don't cover the requested `limit` after filtering.

- [ ] **Step 4: Export the new function from `functions/src/index.ts`**

Modify `functions/src/index.ts`:

```ts
import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';
import { REGION } from './config/config';

admin.initializeApp();
setGlobalOptions({ region: REGION });

export { lookupUserByEmail } from './users/lookupUserByEmail';
export { notify } from './notifications/receiveNotification';
export { onTaskCreated, onTaskMovedToDone } from './tasks/taskNotifications';
export { mcpGetRecentLogs } from './mcp/mcpGetRecentLogs';
```

- [ ] **Step 5: Build to verify no TypeScript errors**

Run: `cd functions && npm run build`
Expected: command exits with code 0, no `tsc` errors, `functions/lib/mcp/mcpGetRecentLogs.js` exists.

- [ ] **Step 6: Commit**

```bash
git add functions/src/mcp/resolveProjectByApiKey.ts functions/src/mcp/taskStatus.ts functions/src/mcp/mcpGetRecentLogs.ts functions/src/index.ts
git commit -m "feat: add mcpGetRecentLogs Cloud Function"
```

---

### Task 2: `mcpListTasks` endpoint

**Files:**
- Create: `functions/src/mcp/mcpListTasks.ts`
- Modify: `functions/src/index.ts`

**Interfaces:**
- Consumes: `resolveProjectByApiKey` from `./resolveProjectByApiKey` (Task 1), `TASK_STATUSES`/`TaskStatusValue` from `./taskStatus` (Task 1).

- [ ] **Step 1: Create the `mcpListTasks` Cloud Function**

`functions/src/mcp/mcpListTasks.ts`:

```ts
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { resolveProjectByApiKey } from './resolveProjectByApiKey';
import { TASK_STATUSES, type TaskStatusValue } from './taskStatus';

export const mcpListTasks = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = req.headers['api-key'] as string | undefined;
  if (!apiKey || typeof apiKey !== 'string') {
    res.status(401).json({ error: 'Missing API key' });
    return;
  }

  const db = admin.firestore();
  const resolved = await resolveProjectByApiKey(db, apiKey);
  if (!resolved) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  const { status } = req.body as { status?: unknown };

  if (status !== undefined && !TASK_STATUSES.includes(status as TaskStatusValue)) {
    res.status(400).json({ error: `status must be one of: ${TASK_STATUSES.join(', ')}` });
    return;
  }

  const snap = await db
    .collection('projects')
    .doc(resolved.projectId)
    .collection('tasks')
    .orderBy('order', 'asc')
    .get();

  let docs = snap.docs;
  if (status !== undefined) {
    docs = docs.filter((d) => d.data().status === status);
  }

  const tasks = docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title,
      customTitle: data.customTitle ?? data.title,
      description: data.description,
      status: data.status,
      urgency: data.urgency,
      category: data.category,
      order: data.order,
    };
  });

  res.status(200).json({ tasks });
});
```

Note: filtering by `status` happens in-memory over all of the project's tasks (already ordered by `order`) rather than via a Firestore composite index — a kanban board's task count is small enough that this is simpler than managing a new index, same rationale as `mcpGetRecentLogs`.

- [ ] **Step 2: Export the new function from `functions/src/index.ts`**

Modify `functions/src/index.ts`, adding the new export line:

```ts
export { mcpGetRecentLogs } from './mcp/mcpGetRecentLogs';
export { mcpListTasks } from './mcp/mcpListTasks';
```

- [ ] **Step 3: Build to verify no TypeScript errors**

Run: `cd functions && npm run build`
Expected: exit code 0, `functions/lib/mcp/mcpListTasks.js` exists.

- [ ] **Step 4: Commit**

```bash
git add functions/src/mcp/mcpListTasks.ts functions/src/index.ts
git commit -m "feat: add mcpListTasks Cloud Function"
```

---

### Task 3: `mcpCreateTask` endpoint

**Files:**
- Create: `functions/src/mcp/formatTaskTitle.ts`
- Create: `functions/src/mcp/mcpCreateTask.ts`
- Modify: `functions/src/index.ts`

**Interfaces:**
- Consumes: `resolveProjectByApiKey` (Task 1), `TASK_STATUSES`/`TaskStatusValue`/`MCP_CREATED_BY_UID` from `./taskStatus` (Task 1).
- Produces: `formatTaskTitle(projectIdentifier, serialNumber, customTitle): string` — pure port of `src/db/tasks/taskTitle.ts`'s `formatTaskTitle`, duplicated here because `functions/` and `src/` are separate TypeScript projects with no shared module boundary.

- [ ] **Step 1: Port the title-formatting helper**

`functions/src/mcp/formatTaskTitle.ts`:

```ts
export function formatTaskTitle(
  projectIdentifier: string | undefined,
  serialNumber: number | undefined,
  customTitle: string,
): string {
  const trimmedTitle = customTitle.trim();

  if (projectIdentifier && serialNumber) {
    return `${projectIdentifier}-${serialNumber}-${trimmedTitle}`;
  }

  return trimmedTitle;
}
```

- [ ] **Step 2: Create the `mcpCreateTask` Cloud Function**

`functions/src/mcp/mcpCreateTask.ts`:

```ts
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { resolveProjectByApiKey } from './resolveProjectByApiKey';
import { TASK_STATUSES, MCP_CREATED_BY_UID, type TaskStatusValue } from './taskStatus';
import { formatTaskTitle } from './formatTaskTitle';

export const mcpCreateTask = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = req.headers['api-key'] as string | undefined;
  if (!apiKey || typeof apiKey !== 'string') {
    res.status(401).json({ error: 'Missing API key' });
    return;
  }

  const db = admin.firestore();
  const resolved = await resolveProjectByApiKey(db, apiKey);
  if (!resolved) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  const { title, description, status } = req.body as {
    title?: unknown;
    description?: unknown;
    status?: unknown;
  };

  if (typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  if (status !== undefined && !TASK_STATUSES.includes(status as TaskStatusValue)) {
    res.status(400).json({ error: `status must be one of: ${TASK_STATUSES.join(', ')}` });
    return;
  }

  const resolvedStatus: TaskStatusValue = (status as TaskStatusValue | undefined) ?? 'todo';
  const resolvedDescription = typeof description === 'string' ? description : '';
  const projectId = resolved.projectId;

  try {
    const taskId = await db.runTransaction(async (transaction) => {
      const projectRef = db.collection('projects').doc(projectId);
      const projectSnap = await transaction.get(projectRef);
      const projectData = projectSnap.data();
      const projectIdentifier = projectData?.identifier as string | undefined;

      if (!projectIdentifier) {
        throw new Error('PROJECT_IDENTIFIER_MISSING');
      }

      const nextSerialNumber = ((projectData?.taskSerialCounter as number | undefined) ?? 0) + 1;
      const customTitle = title.trim();

      const tasksCol = projectRef.collection('tasks');
      const lastInColumnSnap = await transaction.get(
        tasksCol.where('status', '==', resolvedStatus).orderBy('order', 'desc').limit(1),
      );
      const order = lastInColumnSnap.empty
        ? 1000
        : (lastInColumnSnap.docs[0].data().order as number) + 1;

      const taskRef = tasksCol.doc();
      transaction.set(taskRef, {
        projectId,
        title: formatTaskTitle(projectIdentifier, nextSerialNumber, customTitle),
        customTitle,
        projectIdentifier,
        serialNumber: nextSerialNumber,
        description: resolvedDescription,
        status: resolvedStatus,
        urgency: 'medium',
        category: 'feature',
        attachments: [],
        order,
        createdByUid: MCP_CREATED_BY_UID,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.update(projectRef, {
        taskSerialCounter: nextSerialNumber,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return taskRef.id;
    });

    res.status(200).json({ ok: true, taskId });
  } catch (err) {
    if (err instanceof Error && err.message === 'PROJECT_IDENTIFIER_MISSING') {
      res.status(400).json({ error: 'Project has no identifier configured' });
      return;
    }
    console.error('mcpCreateTask failed', err);
    res.status(500).json({ error: 'Internal error' });
  }
});
```

- [ ] **Step 3: Export the new function from `functions/src/index.ts`**

Modify `functions/src/index.ts`, adding:

```ts
export { mcpCreateTask } from './mcp/mcpCreateTask';
```

- [ ] **Step 4: Build to verify no TypeScript errors**

Run: `cd functions && npm run build`
Expected: exit code 0, `functions/lib/mcp/mcpCreateTask.js` exists.

- [ ] **Step 5: Commit**

```bash
git add functions/src/mcp/formatTaskTitle.ts functions/src/mcp/mcpCreateTask.ts functions/src/index.ts
git commit -m "feat: add mcpCreateTask Cloud Function"
```

---

### Task 4: `mcpUpdateTaskStatus` endpoint

**Files:**
- Create: `functions/src/mcp/mcpUpdateTaskStatus.ts`
- Modify: `functions/src/index.ts`

**Interfaces:**
- Consumes: `resolveProjectByApiKey` (Task 1), `TASK_STATUSES`/`TaskStatusValue`/`MCP_CREATED_BY_UID` from `./taskStatus` (Task 1).

- [ ] **Step 1: Create the `mcpUpdateTaskStatus` Cloud Function**

`functions/src/mcp/mcpUpdateTaskStatus.ts`:

```ts
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { resolveProjectByApiKey } from './resolveProjectByApiKey';
import { TASK_STATUSES, MCP_CREATED_BY_UID, type TaskStatusValue } from './taskStatus';

export const mcpUpdateTaskStatus = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = req.headers['api-key'] as string | undefined;
  if (!apiKey || typeof apiKey !== 'string') {
    res.status(401).json({ error: 'Missing API key' });
    return;
  }

  const db = admin.firestore();
  const resolved = await resolveProjectByApiKey(db, apiKey);
  if (!resolved) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  const { taskId, status } = req.body as { taskId?: unknown; status?: unknown };

  if (typeof taskId !== 'string' || !taskId.trim()) {
    res.status(400).json({ error: 'taskId is required' });
    return;
  }

  if (typeof status !== 'string' || !TASK_STATUSES.includes(status as TaskStatusValue)) {
    res.status(400).json({ error: `status must be one of: ${TASK_STATUSES.join(', ')}` });
    return;
  }

  const taskRef = db
    .collection('projects')
    .doc(resolved.projectId)
    .collection('tasks')
    .doc(taskId);

  const taskSnap = await taskRef.get();
  if (!taskSnap.exists) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  await taskRef.update({
    status,
    updatedByUid: MCP_CREATED_BY_UID,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.status(200).json({ ok: true });
});
```

Note: scoping the task lookup under `projects/{resolved.projectId}/tasks/{taskId}` is what prevents an apiKey from one project updating a task that belongs to another project — a wrong/foreign `taskId` simply won't exist at that path and returns `404`.

- [ ] **Step 2: Export the new function from `functions/src/index.ts`**

Modify `functions/src/index.ts`, adding:

```ts
export { mcpUpdateTaskStatus } from './mcp/mcpUpdateTaskStatus';
```

- [ ] **Step 3: Build to verify no TypeScript errors**

Run: `cd functions && npm run build`
Expected: exit code 0, `functions/lib/mcp/mcpUpdateTaskStatus.js` exists.

- [ ] **Step 4: Commit**

```bash
git add functions/src/mcp/mcpUpdateTaskStatus.ts functions/src/index.ts
git commit -m "feat: add mcpUpdateTaskStatus Cloud Function"
```

---

### Task 5: Manually verify all 4 Cloud Functions against the emulator

**Files:** none (verification only).

- [ ] **Step 1: Start the emulators**

Run (repo root): `npm start`
Expected: Docker emulators come up, `http://localhost:4000` (Emulator UI) and `http://localhost:5173` (frontend) become reachable, per `scripts/start.sh`.

- [ ] **Step 2: Get a test project's apiKey and identifier**

Open `http://localhost:5173`, log in, create or open a project, and:
1. In the project's Settings view, set a 2-4 letter uppercase identifier (e.g. `MCP`) if one isn't set yet — `mcpCreateTask` requires it.
2. Copy the project's `apiKey` (visible in Settings) and the project's Firestore document id (visible in the URL, e.g. `/project/<projectId>/...`).

Keep both values handy as `<API_KEY>` and `<PROJECT_ID>` for the curl commands below.

- [ ] **Step 3: Test `mcpGetRecentLogs` — happy path and auth errors**

Run:
```bash
curl -s -X POST http://localhost:5001/cortex-cic/europe-west1/mcpGetRecentLogs \
  -H "api-key: <API_KEY>" -H "Content-Type: application/json" -d '{}'
```
Expected: `200` with `{"logs": [...]}` (empty array if the project has no notifications yet).

Run:
```bash
curl -s -X POST http://localhost:5001/cortex-cic/europe-west1/mcpGetRecentLogs \
  -H "api-key: wrong-key" -H "Content-Type: application/json" -d '{}'
```
Expected: `401` with `{"error":"Invalid API key"}`.

Run:
```bash
curl -s -X POST http://localhost:5001/cortex-cic/europe-west1/mcpGetRecentLogs \
  -H "api-key: <API_KEY>" -H "Content-Type: application/json" -d '{"type":"bogus"}'
```
Expected: `400` with `{"error":"type must be one of: info, error, warning, deploy"}`.

- [ ] **Step 4: Test `mcpCreateTask`**

Run:
```bash
curl -s -X POST http://localhost:5001/cortex-cic/europe-west1/mcpCreateTask \
  -H "api-key: <API_KEY>" -H "Content-Type: application/json" \
  -d '{"title":"Test MCP task","description":"created via curl"}'
```
Expected: `200` with `{"ok":true,"taskId":"<some-id>"}`. Confirm in the app's kanban board (`http://localhost:5173`) that a new task titled `MCP-1-Test MCP task` appears in the `todo` column.

Run (missing title):
```bash
curl -s -X POST http://localhost:5001/cortex-cic/europe-west1/mcpCreateTask \
  -H "api-key: <API_KEY>" -H "Content-Type: application/json" -d '{}'
```
Expected: `400` with `{"error":"title is required"}`.

- [ ] **Step 5: Test `mcpListTasks`**

Run:
```bash
curl -s -X POST http://localhost:5001/cortex-cic/europe-west1/mcpListTasks \
  -H "api-key: <API_KEY>" -H "Content-Type: application/json" -d '{}'
```
Expected: `200` with `{"tasks":[...]}` including the task created in Step 4. Note its `id` as `<TASK_ID>` for the next step.

- [ ] **Step 6: Test `mcpUpdateTaskStatus`**

Run:
```bash
curl -s -X POST http://localhost:5001/cortex-cic/europe-west1/mcpUpdateTaskStatus \
  -H "api-key: <API_KEY>" -H "Content-Type: application/json" \
  -d '{"taskId":"<TASK_ID>","status":"inprogress"}'
```
Expected: `200` with `{"ok":true}`. Confirm in the kanban board that the task moved to the "In Progress" column.

Run (unknown taskId):
```bash
curl -s -X POST http://localhost:5001/cortex-cic/europe-west1/mcpUpdateTaskStatus \
  -H "api-key: <API_KEY>" -H "Content-Type: application/json" \
  -d '{"taskId":"does-not-exist","status":"done"}'
```
Expected: `404` with `{"error":"Task not found"}`.

- [ ] **Step 7: Stop the emulators**

Run: `npm run stop`

---

## Part B — MCP server (`mcp-server/`)

### Task 6: Scaffold the package + config loader

**Files:**
- Create: `mcp-server/package.json`
- Create: `mcp-server/tsconfig.json`
- Create: `mcp-server/src/config.ts`
- Create: `mcp-server/src/config.test.ts`

**Interfaces:**
- Produces: `interface CortexConfig { apiKey: string; functionsBaseUrl: string }` and `loadConfig(env?: NodeJS.ProcessEnv): CortexConfig` — consumed by Tasks 7-9.

- [ ] **Step 1: Create the package manifest**

`mcp-server/package.json`:

```json
{
  "name": "cortex-mcp-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "node --import tsx --test src/config.test.ts src/cortexClient.test.ts src/tools.test.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^24.12.2",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 2: Create the TypeScript config**

`mcp-server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 3: Write the failing test for `loadConfig`**

`mcp-server/src/config.test.ts`:

```ts
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
```

- [ ] **Step 4: Install dependencies**

Run: `cd mcp-server && npm install`
Expected: exit code 0, `mcp-server/node_modules` and `mcp-server/package-lock.json` created.

- [ ] **Step 5: Run the test to verify it fails**

Run: `cd mcp-server && npm test`
Expected: FAIL — `config.ts` does not exist yet, module not found error.

- [ ] **Step 6: Implement `loadConfig`**

`mcp-server/src/config.ts`:

```ts
export interface CortexConfig {
  apiKey: string;
  functionsBaseUrl: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): CortexConfig {
  const apiKey = env.CORTEX_API_KEY;
  const functionsBaseUrl = env.CORTEX_FUNCTIONS_BASE_URL;

  if (!apiKey) {
    throw new Error('CORTEX_API_KEY environment variable is required');
  }
  if (!functionsBaseUrl) {
    throw new Error('CORTEX_FUNCTIONS_BASE_URL environment variable is required');
  }

  return { apiKey, functionsBaseUrl: functionsBaseUrl.replace(/\/$/, '') };
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd mcp-server && npm test`
Expected: PASS — all 3 tests in `config.test.ts` green.

- [ ] **Step 8: Commit**

```bash
git add mcp-server/package.json mcp-server/package-lock.json mcp-server/tsconfig.json mcp-server/src/config.ts mcp-server/src/config.test.ts
git commit -m "feat: scaffold cortex-mcp-server package with config loader"
```

---

### Task 7: HTTP client for the Cloud Functions

**Files:**
- Create: `mcp-server/src/cortexClient.ts`
- Create: `mcp-server/src/cortexClient.test.ts`

**Interfaces:**
- Produces: `interface CortexFunctionResponse { ok: boolean; status: number; body: Record<string, unknown> }` and `callCortexFunction(functionsBaseUrl: string, apiKey: string, functionName: string, payload: Record<string, unknown>): Promise<CortexFunctionResponse>` — consumed by Task 8.

- [ ] **Step 1: Write the failing tests**

`mcp-server/src/cortexClient.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mcp-server && npm test`
Expected: FAIL — `cortexClient.ts` does not exist yet.

- [ ] **Step 3: Implement `callCortexFunction`**

`mcp-server/src/cortexClient.ts`:

```ts
export interface CortexFunctionResponse {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

export async function callCortexFunction(
  functionsBaseUrl: string,
  apiKey: string,
  functionName: string,
  payload: Record<string, unknown>,
): Promise<CortexFunctionResponse> {
  const response = await fetch(`${functionsBaseUrl}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  return { ok: response.ok, status: response.status, body };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd mcp-server && npm test`
Expected: PASS — all tests in `config.test.ts` and `cortexClient.test.ts` green.

- [ ] **Step 5: Commit**

```bash
git add mcp-server/src/cortexClient.ts mcp-server/src/cortexClient.test.ts
git commit -m "feat: add cortexClient HTTP wrapper to cortex-mcp-server"
```

---

### Task 8: Tool definitions

**Files:**
- Create: `mcp-server/src/tools.ts`
- Create: `mcp-server/src/tools.test.ts`

**Interfaces:**
- Consumes: `callCortexFunction` (Task 7), `CortexConfig` (Task 6).
- Produces: `interface ToolTextResult { content: { type: 'text'; text: string }[]; isError?: boolean }`, `toToolResult(response): ToolTextResult`, `buildTools(config: CortexConfig): ToolDefinition[]` where each `ToolDefinition` has `{ name: string; description: string; inputSchema: Record<string, ZodTypeAny>; handler: (args) => Promise<ToolTextResult> }` — consumed by Task 9.

- [ ] **Step 1: Write the failing tests**

`mcp-server/src/tools.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mcp-server && npm test`
Expected: FAIL — `tools.ts` does not exist yet.

- [ ] **Step 3: Implement `tools.ts`**

`mcp-server/src/tools.ts`:

```ts
import { z } from 'zod';
import { callCortexFunction, type CortexFunctionResponse } from './cortexClient.js';
import type { CortexConfig } from './config.js';

const LOG_TYPES = ['info', 'error', 'warning', 'deploy'] as const;
const TASK_STATUSES = ['todo', 'inprogress', 'done', 'block'] as const;

export interface ToolTextResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, z.ZodTypeAny>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (args: any) => Promise<ToolTextResult>;
}

export function toToolResult(response: CortexFunctionResponse): ToolTextResult {
  if (!response.ok) {
    const message =
      typeof response.body.error === 'string'
        ? response.body.error
        : `Request failed with status ${response.status}`;
    return { content: [{ type: 'text', text: message }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(response.body, null, 2) }] };
}

export function buildTools(config: CortexConfig): ToolDefinition[] {
  return [
    {
      name: 'get_recent_logs',
      description:
        'Recupera gli ultimi log/notifiche del progetto cortexCic configurato, opzionalmente filtrati per tipo.',
      inputSchema: {
        type: z.enum(LOG_TYPES).optional().describe('Filtra per tipo di log'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Numero massimo di log da restituire (default 20)'),
      },
      handler: async (args) => {
        const response = await callCortexFunction(
          config.functionsBaseUrl,
          config.apiKey,
          'mcpGetRecentLogs',
          args,
        );
        return toToolResult(response);
      },
    },
    {
      name: 'create_task',
      description: 'Crea una nuova task nella kanban del progetto cortexCic configurato.',
      inputSchema: {
        title: z.string().min(1).describe('Titolo della task'),
        description: z.string().optional().describe('Descrizione della task'),
        status: z.enum(TASK_STATUSES).optional().describe('Colonna iniziale (default todo)'),
      },
      handler: async (args) => {
        const response = await callCortexFunction(
          config.functionsBaseUrl,
          config.apiKey,
          'mcpCreateTask',
          args,
        );
        return toToolResult(response);
      },
    },
    {
      name: 'list_tasks',
      description: 'Elenca le task del progetto cortexCic configurato, opzionalmente filtrate per colonna.',
      inputSchema: {
        status: z.enum(TASK_STATUSES).optional().describe('Filtra per colonna'),
      },
      handler: async (args) => {
        const response = await callCortexFunction(
          config.functionsBaseUrl,
          config.apiKey,
          'mcpListTasks',
          args,
        );
        return toToolResult(response);
      },
    },
    {
      name: 'update_task_status',
      description: 'Sposta una task del progetto cortexCic configurato in un’altra colonna.',
      inputSchema: {
        taskId: z.string().min(1).describe('ID della task da aggiornare'),
        status: z.enum(TASK_STATUSES).describe('Nuova colonna'),
      },
      handler: async (args) => {
        const response = await callCortexFunction(
          config.functionsBaseUrl,
          config.apiKey,
          'mcpUpdateTaskStatus',
          args,
        );
        return toToolResult(response);
      },
    },
  ];
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd mcp-server && npm test`
Expected: PASS — all tests across `config.test.ts`, `cortexClient.test.ts`, `tools.test.ts` green.

- [ ] **Step 5: Commit**

```bash
git add mcp-server/src/tools.ts mcp-server/src/tools.test.ts
git commit -m "feat: add MCP tool definitions to cortex-mcp-server"
```

---

### Task 9: Server entrypoint

**Files:**
- Create: `mcp-server/src/index.ts`

**Interfaces:**
- Consumes: `loadConfig` (Task 6), `buildTools` (Task 8).

- [ ] **Step 1: Implement the stdio entrypoint**

`mcp-server/src/index.ts`:

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { buildTools } from './tools.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const server = new McpServer({ name: 'cortex-mcp-server', version: '0.1.0' });

  for (const tool of buildTools(config)) {
    // registerTool's generic signature can't be inferred across a heterogeneous
    // array of tool definitions; each handler's args type is already enforced
    // by its own inputSchema at the call site in tools.ts.
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      tool.handler as never,
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('cortex-mcp-server failed to start:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Build the package**

Run: `cd mcp-server && npm run build`
Expected: exit code 0, `mcp-server/dist/index.js` and `mcp-server/dist/tools.js` etc. exist.

- [ ] **Step 3: Run the full test suite once more**

Run: `cd mcp-server && npm test`
Expected: PASS — all tests still green (this task adds no new tests; it wires up existing, already-tested pieces).

- [ ] **Step 4: Commit**

```bash
git add mcp-server/src/index.ts
git commit -m "feat: wire up cortex-mcp-server stdio entrypoint"
```

---

### Task 10: Local wiring docs + end-to-end manual check

**Files:**
- Create: `mcp-server/.env.example`
- Create: `mcp-server/README.md`

- [ ] **Step 1: Create the env example**

`mcp-server/.env.example`:

```
CORTEX_API_KEY=your-project-api-key
CORTEX_FUNCTIONS_BASE_URL=https://europe-west1-cortex-cic.cloudfunctions.net
```

- [ ] **Step 2: Create the README**

`mcp-server/README.md`:

```markdown
# cortex-mcp-server

Local MCP server exposing 4 tools backed by cortexCic's Cloud Functions, scoped to a single project via its `apiKey`.

## Setup

```bash
npm install
npm run build
```

## Configuration

Two env vars, no `.env` file is read automatically — pass them through your MCP client's config (see below), or export them in your shell when running `npm start` directly:

- `CORTEX_API_KEY` — the target project's apiKey (Settings page in cortexCic).
- `CORTEX_FUNCTIONS_BASE_URL` — e.g. `https://europe-west1-cortex-cic.cloudfunctions.net` for production, or `http://localhost:5001/cortex-cic/europe-west1` for the local emulator.

## Tools

- `get_recent_logs({ type?, limit? })`
- `create_task({ title, description?, status? })`
- `list_tasks({ status? })`
- `update_task_status({ taskId, status })`

## Registering with Claude Code

Add to `.mcp.json` (project-level) or your client's MCP config:

```json
{
  "mcpServers": {
    "cortex": {
      "command": "node",
      "args": ["/absolute/path/to/cortexCic/mcp-server/dist/index.js"],
      "env": {
        "CORTEX_API_KEY": "your-project-api-key",
        "CORTEX_FUNCTIONS_BASE_URL": "https://europe-west1-cortex-cic.cloudfunctions.net"
      }
    }
  }
}
```
```

- [ ] **Step 3: Manually verify against the running emulator**

With the emulator still running from Task 5 (or restarted via `npm start` at repo root):

1. Export the env vars in your shell, pointing at the emulator:
   ```bash
   export CORTEX_API_KEY=<API_KEY>
   export CORTEX_FUNCTIONS_BASE_URL=http://localhost:5001/cortex-cic/europe-west1
   ```
2. Run: `cd mcp-server && npm run build && npm start`
   Expected: the process starts and hangs waiting for stdio input (no crash, no thrown error from `loadConfig`) — this confirms the server boots and connects to the stdio transport. Stop it with Ctrl+C.
3. Add the `mcp-server` entry to this repo's `.mcp.json` (create it at repo root if it doesn't exist) using the snippet from `mcp-server/README.md`, pointing `CORTEX_FUNCTIONS_BASE_URL` at the emulator URL from step 1.
4. Restart Claude Code in this repo so it picks up the new MCP server, then ask it to call `list_tasks` and `get_recent_logs` for the test project — confirm the tool results match what Task 5's curl tests returned.

- [ ] **Step 4: Commit**

```bash
git add mcp-server/.env.example mcp-server/README.md
git commit -m "docs: add cortex-mcp-server setup README and env example"
```

---

### Task 11: Deploy the Cloud Functions to production

**This task deploys to the live `cortex-cic` Firebase project — confirm with the user before running the deploy command.**

**Files:** none.

- [ ] **Step 1: Confirm with the user that production deploy is wanted now**

Ask explicitly before proceeding — this affects the real, shared Firebase project, not just local emulator state.

- [ ] **Step 2: Deploy**

Run (repo root): `firebase deploy --only functions:mcpGetRecentLogs,functions:mcpListTasks,functions:mcpCreateTask,functions:mcpUpdateTaskStatus`
Expected: deploy succeeds, output lists all 4 function URLs under `europe-west1`.

- [ ] **Step 3: Smoke-test one endpoint against production**

Run (replace `<API_KEY>` with a real project's apiKey):
```bash
curl -s -X POST https://europe-west1-cortex-cic.cloudfunctions.net/mcpListTasks \
  -H "api-key: <API_KEY>" -H "Content-Type: application/json" -d '{}'
```
Expected: `200` with `{"tasks": [...]}` reflecting that project's real tasks.

- [ ] **Step 4: Point the local `mcp-server` config at production**

Update `CORTEX_FUNCTIONS_BASE_URL` in `.mcp.json` (or your shell env) to `https://europe-west1-cortex-cic.cloudfunctions.net`, restart Claude Code, and confirm the 4 tools work against real project data.
