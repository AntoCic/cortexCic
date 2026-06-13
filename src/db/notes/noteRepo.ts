import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../../components/firebase/firebase';
import type { Note, NoteWrite } from './Note';

const PAGE_SIZE = 10;

function stripUndefinedFields<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as Partial<T>;
}

function notesCol(uid: string) {
  return collection(db, 'users', uid, 'notes');
}

function docToNote(snap: QueryDocumentSnapshot): Note {
  return { id: snap.id, ...(snap.data() as Omit<Note, 'id'>) };
}

export async function getNotes(
  uid: string,
  after?: Timestamp,
): Promise<{ items: Note[]; hasMore: boolean }> {
  const col = notesCol(uid);
  const q = after
    ? query(col, orderBy('updatedAt', 'desc'), startAfter(after), limit(PAGE_SIZE))
    : query(col, orderBy('updatedAt', 'desc'), limit(PAGE_SIZE));

  const snap = await getDocs(q);
  return {
    items: snap.docs.map(docToNote),
    hasMore: snap.docs.length === PAGE_SIZE,
  };
}

export async function getNoteById(uid: string, noteId: string): Promise<Note | null> {
  const snap = await getDoc(doc(notesCol(uid), noteId));
  if (!snap.exists()) {
    return null;
  }

  return { id: snap.id, ...(snap.data() as Omit<Note, 'id'>) };
}

export async function createNote(
  uid: string,
  data: Omit<NoteWrite, 'createdAt' | 'updatedAt'>,
): Promise<Note> {
  const noteData = stripUndefinedFields(data);
  const fallbackTimestamp = Timestamp.now();
  const ref = await addDoc(notesCol(uid), {
    ...noteData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  const persistedData = snap.data() as Partial<Omit<Note, 'id'>> | undefined;

  return {
    id: ref.id,
    title: (persistedData?.title ?? noteData.title) as Note['title'],
    content: (persistedData?.content ?? data.content) as Note['content'],
    type: (persistedData?.type ?? noteData.type) as Note['type'],
    tags: (persistedData?.tags ?? noteData.tags) as Note['tags'],
    link: (persistedData?.link ?? noteData.link) as Note['link'],
    attachments: (persistedData?.attachments ?? noteData.attachments) as Note['attachments'],
    createdAt: (persistedData?.createdAt ?? fallbackTimestamp) as Note['createdAt'],
    updatedAt: (persistedData?.updatedAt ?? fallbackTimestamp) as Note['updatedAt'],
  };
}

export async function updateNote(
  uid: string,
  noteId: string,
  patch: Partial<Omit<NoteWrite, 'createdAt'>>,
): Promise<void> {
  const cleanPatch = stripUndefinedFields(patch);
  await updateDoc(doc(notesCol(uid), noteId), { ...cleanPatch, updatedAt: serverTimestamp() });
}

export async function deleteNote(uid: string, noteId: string): Promise<void> {
  await deleteDoc(doc(notesCol(uid), noteId));
}
