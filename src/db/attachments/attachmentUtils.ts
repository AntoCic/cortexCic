import { AttachmentKind } from './Attachment';
import type { Attachment, AttachmentKindValue } from './Attachment';

function normalizeMime(contentType?: string): string {
  return (contentType ?? '').toLowerCase();
}

export function getAttachmentKind(fileName: string, contentType?: string): AttachmentKindValue {
  const mime = normalizeMime(contentType);
  const lowerName = fileName.toLowerCase();

  if (mime.startsWith('image/')) {
    return AttachmentKind.Image;
  }

  if (mime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return AttachmentKind.Pdf;
  }

  return AttachmentKind.File;
}

export function isImageAttachment(attachment: Attachment): boolean {
  return attachment.kind === AttachmentKind.Image;
}

export function isPdfAttachment(attachment: Attachment): boolean {
  return attachment.kind === AttachmentKind.Pdf;
}

export function formatAttachmentSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
