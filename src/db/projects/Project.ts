import type { Timestamp } from 'firebase/firestore';
import type { MemberRoleValue } from '../../enums/MemberRole';

export interface ProjectMember {
  email: string;
  role: MemberRoleValue;
  addedAt: Timestamp;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: Record<string, ProjectMember>;
  memberUids: string[];
  apiKey: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ProjectWrite = Omit<Project, 'id'>;
