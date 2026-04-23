import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, Timestamp, Unsubscribe } from 'firebase/firestore';
import { db } from '../../components/firebase/firebase';
import type { Notification } from './Notification';

const PAGE_SIZE = 30;

function notifCol(projectId: string) {
  return collection(db, 'projects', projectId, 'notifications');
}

function docToNotification(snap: QueryDocumentSnapshot): Notification {
  return { id: snap.id, ...(snap.data() as Omit<Notification, 'id'>) };
}

export function subscribeLatestNotifications(
  projectId: string,
  cb: (items: Notification[]) => void,
): Unsubscribe {
  const q = query(notifCol(projectId), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(docToNotification));
  });
}

export async function loadOlderNotifications(
  projectId: string,
  before: Timestamp,
): Promise<{ items: Notification[]; hasMore: boolean }> {
  const q = query(
    notifCol(projectId),
    orderBy('createdAt', 'desc'),
    startAfter(before),
    limit(PAGE_SIZE),
  );
  const snap = await getDocs(q);
  return {
    items: snap.docs.map(docToNotification),
    hasMore: snap.docs.length === PAGE_SIZE,
  };
}

export async function markNotificationsRead(
  projectId: string,
  ids: string[],
  uid: string,
): Promise<void> {
  if (!ids.length) return;
  const batch = writeBatch(db);
  for (const id of ids) {
    batch.update(doc(notifCol(projectId), id), { readByUids: arrayUnion(uid) });
  }
  await batch.commit();
}

export async function togglePin(
  projectId: string,
  notifId: string,
  uid: string,
  currentlyPinned: boolean,
): Promise<void> {
  await updateDoc(doc(notifCol(projectId), notifId), {
    pinnedByUids: currentlyPinned ? arrayRemove(uid) : arrayUnion(uid),
  });
}
