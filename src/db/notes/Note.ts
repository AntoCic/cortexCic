import type { Timestamp } from 'firebase/firestore';
import type { NoteTypeValue } from '../../enums/NoteType';

export interface Note {
  id: string;
  title: string;
  content: string;
  type?: NoteTypeValue;
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type NoteWrite = Omit<Note, 'id'>;
