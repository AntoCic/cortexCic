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
