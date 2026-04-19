import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../../components/firebase/firebase';
import type { Task, TaskWrite } from './Task';

function tasksCol(projectId: string) {
  return collection(db, 'projects', projectId, 'tasks');
}

function docToTask(id: string, data: Record<string, unknown>): Task {
  return { id, ...(data as Omit<Task, 'id'>) };
}

export async function createTask(projectId: string, data: Omit<TaskWrite, 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(tasksCol(projectId), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTask(projectId: string, taskId: string, patch: Partial<Omit<TaskWrite, 'createdAt'>>): Promise<void> {
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
