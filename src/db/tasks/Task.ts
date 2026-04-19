import type { Timestamp } from 'firebase/firestore';
import type { TaskStatusValue } from '../../enums/TaskStatus';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatusValue;
  order: number;
  createdByUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TaskWrite = Omit<Task, 'id'>;
