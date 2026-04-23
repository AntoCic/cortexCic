import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string | null;
  photoURL: string | null;
  fcmTokens: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type UserProfileWrite = Omit<UserProfile, 'uid'>;
