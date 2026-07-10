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
  deleteField,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../../components/firebase/firebase';
import type { Project, ProjectMember, ProjectWrite } from './Project';
import { normalizeProjectIdentifierInput } from './projectIdentifier';
import { MemberRole, isMemberRole } from '../../enums/MemberRole';

const col = collection(db, 'projects');

function normalizeMembers(value: unknown): Record<string, ProjectMember> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([uid, rawMember]) => {
      if (!rawMember || typeof rawMember !== 'object' || Array.isArray(rawMember)) return [];

      const member = rawMember as Partial<ProjectMember>;
      if (typeof member.email !== 'string' || !member.email.trim()) return [];

      return [[uid, {
        ...member,
        email: member.email,
        role: isMemberRole(member.role) ? member.role : MemberRole.Member,
      } as ProjectMember]];
    }),
  );
}

function docToProject(id: string, data: Record<string, unknown>): Project {
  const project = data as Omit<Project, 'id'>;
  return {
    id,
    ...project,
    members: normalizeMembers(project.members),
    memberUids: Array.isArray(project.memberUids) ? project.memberUids.filter((uid): uid is string => typeof uid === 'string') : [],
  };
}

export async function createProject(data: Omit<ProjectWrite, 'createdAt' | 'updatedAt'>): Promise<string> {
  const normalizedIdentifier = data.identifier ? normalizeProjectIdentifierInput(data.identifier) : undefined;
  const ref = await addDoc(col, {
    ...data,
    taskSerialCounter: data.taskSerialCounter ?? 0,
    ...(normalizedIdentifier ? { identifier: normalizedIdentifier } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProject(id: string, patch: Partial<Omit<ProjectWrite, 'createdAt'>>): Promise<void> {
  const normalizedIdentifier = typeof patch.identifier === 'string'
    ? normalizeProjectIdentifierInput(patch.identifier)
    : patch.identifier;
  await updateDoc(doc(col, id), {
    ...patch,
    ...(typeof normalizedIdentifier === 'string' ? { identifier: normalizedIdentifier } : {}),
    updatedAt: serverTimestamp(),
  });
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
    [`members.${uid}`]: deleteField(),
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
