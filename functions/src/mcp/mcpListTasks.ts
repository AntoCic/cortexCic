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
