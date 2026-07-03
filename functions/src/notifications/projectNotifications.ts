import * as admin from 'firebase-admin';

export const PROJECT_NOTIFICATION_TYPES = ['info', 'error', 'warning', 'deploy', 'success'] as const;
export type ProjectNotificationType = (typeof PROJECT_NOTIFICATION_TYPES)[number];

const TYPE_LABEL: Record<ProjectNotificationType, string> = {
  info: 'Info',
  error: 'Errore',
  warning: 'Warning',
  deploy: 'Deploy',
  success: 'Success',
};

interface NotifyProjectMembersParams {
  db: admin.firestore.Firestore;
  projectId: string;
  projectData: admin.firestore.DocumentData;
  message: string;
  type: ProjectNotificationType;
  payload?: Record<string, unknown>;
  showPush?: boolean;
  excludeUid?: string;
}

async function getProjectMemberTokens(
  db: admin.firestore.Firestore,
  projectData: admin.firestore.DocumentData,
  excludeUid?: string,
): Promise<string[]> {
  const memberUids: string[] = projectData.memberUids ?? [];
  if (!memberUids.length) return [];

  const tokens: string[] = [];

  await Promise.all(
    memberUids
      .filter((uid) => uid && uid !== excludeUid)
      .map(async (uid) => {
        const userSnap = await db.collection('users').doc(uid).get();
        const fcmTokens: string[] = userSnap.data()?.fcmTokens ?? [];
        tokens.push(...fcmTokens);
      }),
  );

  return [...new Set(tokens)].filter(Boolean);
}

export async function sendPushToProjectMembers({
  db,
  projectData,
  message,
  type,
  payload,
  excludeUid,
}: NotifyProjectMembersParams): Promise<void> {
  const validTokens = await getProjectMemberTokens(db, projectData, excludeUid);
  if (!validTokens.length) return;

  const payloadUrl = typeof payload?.url === 'string' ? payload.url : undefined;

  const fcmMessage: admin.messaging.MulticastMessage = {
    tokens: validTokens,
    data: {
      title: `[${TYPE_LABEL[type]}] cortexCic`,
      body: message,
      ...(payloadUrl ? { url: payloadUrl } : {}),
    },
  };

  const result = await admin.messaging().sendEachForMulticast(fcmMessage);
  if (result.failureCount > 0) {
    console.warn(`FCM: ${result.failureCount} token(s) failed`);
  }
}

export async function createProjectNotification({
  db,
  projectId,
  message,
  type,
  payload,
  showPush = false,
}: NotifyProjectMembersParams): Promise<void> {
  await db
    .collection('projects')
    .doc(projectId)
    .collection('notifications')
    .add({
      projectId,
      type,
      message,
      payload: payload ?? null,
      showPush,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      readByUids: [],
      pinnedByUids: [],
    });
}

export async function notifyProjectMembers(params: NotifyProjectMembersParams): Promise<void> {
  const {
    db,
    projectId,
    projectData,
    message,
    type,
    payload,
    showPush = false,
    excludeUid,
  } = params;

  await createProjectNotification({
    db,
    projectId,
    projectData,
    message,
    type,
    payload,
    showPush,
  });

  if (showPush) {
    await sendPushToProjectMembers({
      db,
      projectId,
      projectData,
      message,
      type,
      payload,
      showPush,
      excludeUid,
    });
  }
}
