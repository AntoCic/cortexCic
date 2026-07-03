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
  /** Push-only targeting: send to just this member's tokens instead of the whole project. The in-app notification record is unaffected — it stays project-wide like every other notification (no per-recipient field exists on that model). */
  onlyUid?: string;
}

function getProjectName(projectData: admin.firestore.DocumentData): string {
  const name = typeof projectData.name === 'string' ? projectData.name.trim() : '';
  return name || 'Progetto';
}

// ponytail: fixed `[NomeProgetto] ` format everywhere, no truncation/identifier fallback — add if long names prove noisy
function withProjectPrefix(projectData: admin.firestore.DocumentData, message: string): string {
  return `[${getProjectName(projectData)}] ${message}`;
}

async function getProjectMemberTokens(
  db: admin.firestore.Firestore,
  projectData: admin.firestore.DocumentData,
  excludeUid?: string,
  onlyUid?: string,
): Promise<string[]> {
  const memberUids: string[] = projectData.memberUids ?? [];
  if (!memberUids.length) return [];

  const tokens: string[] = [];

  await Promise.all(
    (onlyUid ? memberUids.filter((uid) => uid === onlyUid) : memberUids)
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
  onlyUid,
}: NotifyProjectMembersParams): Promise<void> {
  const validTokens = await getProjectMemberTokens(db, projectData, excludeUid, onlyUid);
  if (!validTokens.length) return;

  const payloadUrl = typeof payload?.url === 'string' ? payload.url : undefined;

  const fcmMessage: admin.messaging.MulticastMessage = {
    tokens: validTokens,
    data: {
      title: `[${getProjectName(projectData)}] ${TYPE_LABEL[type]}`,
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
    onlyUid,
  } = params;

  await createProjectNotification({
    db,
    projectId,
    projectData,
    message: withProjectPrefix(projectData, message),
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
      onlyUid,
    });
  }
}
