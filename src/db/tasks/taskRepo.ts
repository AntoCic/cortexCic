import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import type { FieldValue, Timestamp, Unsubscribe } from 'firebase/firestore';
import { db } from '../../components/firebase/firebase';
import { TaskCategory } from '../../enums/TaskCategory';
import type { Task, TaskWrite } from './Task';
import { TaskUrgency } from '../../enums/TaskUrgency';
import { formatTaskTitle } from './taskTitle';

function tasksCol(projectId: string) {
  return collection(db, 'projects', projectId, 'tasks');
}

function docToTask(id: string, data: Record<string, unknown>): Task {
  const task = data as Omit<Task, 'id'>;
  const customTitle = task.customTitle ?? task.title;

  return {
    id,
    ...task,
    customTitle,
    urgency: task.urgency ?? TaskUrgency.Medium,
    category: task.category ?? TaskCategory.Feature,
    attachments: task.attachments ?? [],
  };
}

export async function createTask(projectId: string, data: Omit<TaskWrite, 'createdAt' | 'updatedAt'>): Promise<string> {
  return runTransaction(db, async (transaction) => {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await transaction.get(projectRef);

    if (!projectSnap.exists()) {
      throw new Error('Progetto non trovato');
    }

    const projectData = projectSnap.data() as {
      identifier?: string;
      taskSerialCounter?: number;
    };
    const projectIdentifier = projectData.identifier;

    if (!projectIdentifier) {
      throw new Error('Configura prima l’identificativo progetto');
    }

    const nextSerialNumber = (projectData.taskSerialCounter ?? 0) + 1;
    const customTitle = (data.customTitle ?? data.title).trim();
    const taskRef = doc(tasksCol(projectId));

    transaction.set(taskRef, {
      ...data,
      title: formatTaskTitle(projectIdentifier, nextSerialNumber, customTitle),
      customTitle,
      projectIdentifier,
      serialNumber: nextSerialNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(projectRef, {
      taskSerialCounter: nextSerialNumber,
      updatedAt: serverTimestamp(),
    });

    return taskRef.id;
  });
}

type TaskPatch = Partial<Omit<TaskWrite, 'createdAt' | 'assigneeUid' | 'dueDate' | 'reminderSentAt'>> & {
  assigneeUid?: string | FieldValue;
  dueDate?: Timestamp | FieldValue;
  reminderSentAt?: Timestamp | FieldValue;
};

export async function updateTask(projectId: string, taskId: string, patch: TaskPatch): Promise<void> {
  await updateDoc(doc(tasksCol(projectId), taskId), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteTask(projectId: string, taskId: string): Promise<void> {
  await deleteDoc(doc(tasksCol(projectId), taskId));
}

export function subscribeProjectTasks(projectId: string, cb: (tasks: Task[]) => void): Unsubscribe {
  const q = query(tasksCol(projectId), orderBy('order', 'asc'));
  return onSnapshot(q, (snap) => {
    const tasks = snap.docs.map((d) => docToTask(d.id, d.data() as Record<string, unknown>));
    cb(tasks);
  });
}
