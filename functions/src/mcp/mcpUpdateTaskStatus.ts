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
