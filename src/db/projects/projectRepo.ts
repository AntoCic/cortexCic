import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../../components/firebase/firebase';
import type { Project, ProjectMember, ProjectWrite } from './Project';

const col = collection(db, 'projects');

function docToProject(id: string, data: Record<string, unknown>): Project {
  return { id, ...(data as Omit<Project, 'id'>) };
}

export async function createProject(data: Omit<ProjectWrite, 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(col, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProject(id: string, patch: Partial<Omit<ProjectWrite, 'createdAt'>>): Promise<void> {
  await updateDoc(doc(col, id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(col, id));
}

export function subscribeUserProjects(
  uid: string,
  cb: (projects: Project[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(col, where('memberUids', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => docToProject(d.id, d.data() as Record<string, unknown>));
    cb(projects);
  }, onError);
}

export function subscribeProject(id: string, cb: (project: Project | null) => void): Unsubscribe {
  return onSnapshot(doc(col, id), (snap) => {
    cb(snap.exists() ? docToProject(snap.id, snap.data() as Record<string, unknown>) : null);
  });
}

export async function addMember(projectId: string, uid: string, member: ProjectMember): Promise<void> {
  await updateDoc(doc(col, projectId), {
    [`members.${uid}`]: member,
    memberUids: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });
}

export async function removeMember(projectId: string, uid: string): Promise<void> {
  const patch: Record<string, unknown> = {
    [`members.${uid}`]: null,
    memberUids: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(col, projectId), patch);
}

export async function regenerateApiKey(projectId: string): Promise<string> {
  const newKey = crypto.randomUUID();
  await updateDoc(doc(col, projectId), { apiKey: newKey, updatedAt: serverTimestamp() });
  return newKey;
}
