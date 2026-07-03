import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { REGION } from '../config/config';
import { notifyProjectMembers } from '../notifications/projectNotifications';

type TaskDoc = {
  title?: string;
  status?: string;
  dueDate?: admin.firestore.Timestamp;
  reminderSentAt?: admin.firestore.Timestamp;
  assigneeUid?: string;
};

function getTaskUrl(projectId: string): string {
  return `/project/${projectId}/tasks`;
}

// Runs once a day; picks up any task due within the next 24h so no task is missed between runs.
export const sendTaskDueReminders = onSchedule(
  {
    region: REGION,
    schedule: 'every day 08:00',
    timeZone: 'Europe/Rome',
  },
  async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const in24h = admin.firestore.Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);

    // Range filter on a single field (dueDate) only — Firestore doesn't allow inequality
    // filters on two different fields in one query, and there's no way to query "field is
    // absent" for reminderSentAt. So status/reminderSentAt are filtered in JS below; the
    // result set (tasks due in the next day, across all projects) is small enough that this
    // is cheaper than building a denormalized flag just to push the filter into Firestore.
    const snap = await db
      .collectionGroup('tasks')
      .where('dueDate', '>=', now)
      .where('dueDate', '<=', in24h)
      .get();

    const projectCache = new Map<string, admin.firestore.DocumentData | null>();

    for (const taskSnap of snap.docs) {
      const task = taskSnap.data() as TaskDoc;
      if (task.status === 'done' || task.reminderSentAt) continue;

      const projectRef = taskSnap.ref.parent.parent;
      if (!projectRef) continue;
      const projectId = projectRef.id;

      let projectData = projectCache.get(projectId);
      if (projectData === undefined) {
        const projectSnap = await projectRef.get();
        projectData = projectSnap.exists ? (projectSnap.data() ?? null) : null;
        projectCache.set(projectId, projectData);
      }
      if (!projectData) continue;

      const taskTitle = task.title?.trim() || 'una task';

      await notifyProjectMembers({
        db,
        projectId,
        projectData,
        type: 'warning',
        message: `Il task ${taskTitle} scade domani`,
        payload: {
          event: 'task_due_reminder',
          projectId,
          taskId: taskSnap.id,
          taskTitle,
          url: getTaskUrl(projectId),
        },
        showPush: true,
        // Task 07 assignee, if set: push only that member. Otherwise all project members.
        onlyUid: task.assigneeUid,
      });

      await taskSnap.ref.update({ reminderSentAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  },
);
