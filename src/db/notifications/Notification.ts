import type { Timestamp } from 'firebase/firestore';

export type NotificationType = 'error' | 'warning' | 'info' | 'preview';

export interface Notification {
  id: string;
  projectId: string;
  type: NotificationType;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
  sentAt: Timestamp;
  readByUids: string[];
}

export type NotificationWrite = Omit<Notification, 'id'>;
