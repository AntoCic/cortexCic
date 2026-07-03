import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { db } from '../../components/firebase/firebase';

export interface TaskComment {
  id: string;
  text: string;
  authorUid: string;
  authorName: string;
  createdAt: Timestamp | null;
}

function commentsCol(projectId: string, taskId: string) {
  return collection(db, 'projects', projectId, 'tasks', taskId, 'comments');
}

export async function listTaskComments(projectId: string, taskId: string): Promise<TaskComment[]> {
  const q = query(commentsCol(projectId, taskId), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TaskComment, 'id'>) }));
}

export async function addTaskComment(
  projectId: string,
  taskId: string,
  data: { text: string; authorUid: string; authorName: string },
): Promise<void> {
  await addDoc(commentsCol(projectId, taskId), { ...data, createdAt: serverTimestamp() });
}

export async function deleteTaskComment(projectId: string, taskId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(commentsCol(projectId, taskId), commentId));
}
