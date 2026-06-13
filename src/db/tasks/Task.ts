import type { Timestamp } from 'firebase/firestore';
import type { Attachment } from '../attachments/Attachment';
import type { TaskCategoryValue } from '../../enums/TaskCategory';
import type { TaskStatusValue } from '../../enums/TaskStatus';
import type { TaskUrgencyValue } from '../../enums/TaskUrgency';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatusValue;
  urgency: TaskUrgencyValue;
  category: TaskCategoryValue;
  attachments?: Attachment[];
  order: number;
  createdByUid: string;
  updatedByUid?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TaskWrite = Omit<Task, 'id'>;
