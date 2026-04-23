import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const VALID_TYPES = ['info', 'error', 'warning', 'deploy'] as const;
type NotificationType = (typeof VALID_TYPES)[number];

const TYPE_LABEL: Record<NotificationType, string> = {
  info: 'Info',
  error: 'Errore',
  warning: 'Warning',
  deploy: 'Deploy',
};

async function sendPushToProjectMembers(
  db: admin.firestore.Firestore,
  projectData: admin.firestore.DocumentData,
  message: string,
  type: NotificationType,
  payloadUrl?: string,
): Promise<void> {
  const memberUids: string[] = projectData.memberUids ?? [];
  if (!memberUids.length) return;

  const tokens: string[] = [];
  await Promise.all(
    memberUids.map(async (uid) => {
      const userSnap = await db.collection('users').doc(uid).get();
      const fcmTokens: string[] = userSnap.data()?.fcmTokens ?? [];
      tokens.push(...fcmTokens);
    }),
  );

  const validTokens = [...new Set(tokens)].filter(Boolean);
  if (!validTokens.length) return;

  const fcmMessage: admin.messaging.MulticastMessage = {
    tokens: validTokens,
    notification: {
      title: `[${TYPE_LABEL[type]}] cortexCic`,
      body: message,
    },
    data: payloadUrl ? { url: payloadUrl } : {},
    webpush: {
      fcmOptions: payloadUrl ? { link: payloadUrl } : undefined,
    },
  };

  const result = await admin.messaging().sendEachForMulticast(fcmMessage);
  if (result.failureCount > 0) {
    console.warn(`FCM: ${result.failureCount} token(s) failed`);
  }
}

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

  if (!type || !VALID_TYPES.includes(type as NotificationType)) {
    res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
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

  const notif = {
    projectId,
    type: type as NotificationType,
    message: message.trim(),
    payload: safePayload,
    showPush: showPush === true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    readByUids: [],
    pinnedByUids: [],
  };

  const ref = await db
    .collection('projects')
    .doc(projectId)
    .collection('notifications')
    .add(notif);

  if (showPush === true) {
    const payloadUrl = typeof safePayload?.url === 'string' ? safePayload.url : undefined;
    await sendPushToProjectMembers(db, projectDoc.data(), message.trim(), type as NotificationType, payloadUrl);
  }

  res.status(200).json({ id: ref.id });
});
