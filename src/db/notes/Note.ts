import type { Timestamp } from 'firebase/firestore';
import type { Attachment } from '../attachments/Attachment';
import type { NoteTypeValue } from '../../enums/NoteType';

export interface Note {
  id: string;
  title?: string;
  content: string;
  type?: NoteTypeValue;
  tags?: string[];
  link?: string;
  attachments?: Attachment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type NoteWrite = Omit<Note, 'id'>;
