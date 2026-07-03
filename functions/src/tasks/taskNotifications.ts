import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { REGION } from '../config/config';
import { notifyProjectMembers } from '../notifications/projectNotifications';

type TaskDoc = {
  title?: string;
  status?: string;
};

function getTaskUrl(projectId: string): string {
  return `/project/${projectId}/tasks`;
}

async function getProjectSnapshot(projectId: string) {
  return admin.firestore().collection('projects').doc(projectId).get();
}

export const onTaskCreated = onDocumentCreated(
  {
    region: REGION,
    document: 'projects/{projectId}/tasks/{taskId}',
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const task = snapshot.data() as TaskDoc;
    const projectId = event.params.projectId;
    const projectSnap = await getProjectSnapshot(projectId);
    if (!projectSnap.exists) return;

    const projectData = projectSnap.data();
    if (!projectData) return;

    const taskTitle = task.title?.trim() || 'Nuova task';

    await notifyProjectMembers({
      db: admin.firestore(),
      projectId,
      projectData,
      type: 'info',
      message: `Nuova task: ${taskTitle}`,
      payload: {
        event: 'task_created',
        projectId,
        taskId: snapshot.id,
        taskTitle,
        url: getTaskUrl(projectId),
      },
      showPush: true,
    });
  },
);

export const onTaskMovedToDone = onDocumentUpdated(
  {
    region: REGION,
    document: 'projects/{projectId}/tasks/{taskId}',
  },
  async (event) => {
    const before = event.data?.before.data() as TaskDoc | undefined;
    const after = event.data?.after.data() as TaskDoc | undefined;

    if (!before || !after) return;
    if (before.status === 'done' || after.status !== 'done') return;

    const projectId = event.params.projectId;
    const projectSnap = await getProjectSnapshot(projectId);
    if (!projectSnap.exists) return;

    const projectData = projectSnap.data();
    if (!projectData) return;

    const taskTitle = after.title?.trim() || 'Task completata';

    await notifyProjectMembers({
      db: admin.firestore(),
      projectId,
      projectData,
      type: 'deploy',
      message: `Task completata: ${taskTitle}`,
      payload: {
        event: 'task_done',
        projectId,
        taskId: event.params.taskId,
        taskTitle,
        url: getTaskUrl(projectId),
      },
      showPush: true,
    });
  },
);
