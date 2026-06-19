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
      const columnTasksSnap = await transaction.get(tasksCol.where('status', '==', resolvedStatus));
      const maxOrder = columnTasksSnap.docs.reduce(
        (max, d) => Math.max(max, (d.data().order as number | undefined) ?? 0),
        0,
      );
      const order = columnTasksSnap.empty ? 1000 : maxOrder + 1;

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
