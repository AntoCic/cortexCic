export const AttachmentKind = {
  Image: 'image',
  Pdf: 'pdf',
  File: 'file',
} as const;

export type AttachmentKindValue = (typeof AttachmentKind)[keyof typeof AttachmentKind];

export interface Attachment {
  id: string;
  name: string;
  downloadURL: string;
  storagePath: string;
  contentType: string;
  size: number;
  kind: AttachmentKindValue;
  uploadedAt: string;
}

export function isAttachmentKind(value: unknown): value is AttachmentKindValue {
  return typeof value === 'string' && Object.values(AttachmentKind).includes(value as AttachmentKindValue);
}
