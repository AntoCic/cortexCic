import type { Timestamp } from 'firebase/firestore';

export type NotificationType = 'info' | 'error' | 'warning' | 'deploy';

export interface Notification {
  id: string;
  projectId: string;
  type: NotificationType;
  message: string;
  payload?: Record<string, unknown>;
  showPush: boolean;
  createdAt: Timestamp;
  readByUids: string[];
  pinnedByUids: string[];
}

export type NotificationWrite = Omit<Notification, 'id'>;
