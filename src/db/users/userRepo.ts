import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../components/firebase/firebase';
import type { UserProfile } from './User';

function userDoc(uid: string) {
  return doc(db, 'users', uid);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...(snap.data() as Omit<UserProfile, 'uid'>) };
}

export async function createUserProfile(
  uid: string,
  data: Pick<UserProfile, 'firstName' | 'lastName' | 'email' | 'photoURL'>,
  fcmToken?: string,
): Promise<void> {
  await setDoc(userDoc(uid), {
    ...data,
    fcmTokens: fcmToken ? [fcmToken] : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, 'firstName' | 'lastName'>>,
): Promise<void> {
  await updateDoc(userDoc(uid), { ...patch, updatedAt: serverTimestamp() });
}

export async function addFcmToken(uid: string, token: string): Promise<void> {
  await updateDoc(userDoc(uid), { fcmTokens: arrayUnion(token), updatedAt: serverTimestamp() });
}

export async function removeFcmToken(uid: string, token: string): Promise<void> {
  await updateDoc(userDoc(uid), { fcmTokens: arrayRemove(token), updatedAt: serverTimestamp() });
}
