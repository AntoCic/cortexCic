import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { notifyProjectMembers, PROJECT_NOTIFICATION_TYPES } from './projectNotifications';

type NotificationType = (typeof PROJECT_NOTIFICATION_TYPES)[number];

export const notify = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey =
    (req.headers['api-key'] as string | undefined) ?? req.body?.apiKey;

  if (!apiKey || typeof apiKey !== 'string') {
    res.status(401).json({ error: 'Missing API key' });
    return;
  }

  const { message, type, payload, showPush } = req.body as {
    message?: unknown;
    type?: unknown;
    payload?: unknown;
    showPush?: unknown;
  };

  if (typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  if (!type || !PROJECT_NOTIFICATION_TYPES.includes(type as NotificationType)) {
    res.status(400).json({ error: `type must be one of: ${PROJECT_NOTIFICATION_TYPES.join(', ')}` });
    return;
  }

  const db = admin.firestore();

  const projectSnap = await db
    .collection('projects')
    .where('apiKey', '==', apiKey)
    .limit(1)
    .get();

  if (projectSnap.empty) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  const projectDoc = projectSnap.docs[0];
  const projectId = projectDoc.id;
  const safePayload =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;

  await notifyProjectMembers({
    db,
    projectId,
    projectData: projectDoc.data(),
    message: message.trim(),
    type: type as NotificationType,
    payload: safePayload ?? undefined,
    showPush: showPush === true,
  });

  res.status(200).json({ ok: true });
});
