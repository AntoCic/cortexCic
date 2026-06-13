import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../components/firebase/firebase';
import { getAttachmentKind } from './attachmentUtils';
import type { Attachment } from './Attachment';

function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'file';
}

function buildStoragePath(pathPrefix: string, fileName: string): string {
  return `${pathPrefix}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

export async function uploadAttachment(pathPrefix: string, file: File): Promise<Attachment> {
  const storagePath = buildStoragePath(pathPrefix, file.name);
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || undefined,
  });

  const downloadURL = await getDownloadURL(storageRef);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    downloadURL,
    storagePath,
    contentType: file.type || 'application/octet-stream',
    size: file.size,
    kind: getAttachmentKind(file.name, file.type),
    uploadedAt: new Date().toISOString(),
  };
}

export async function uploadAttachments(pathPrefix: string, files: File[]): Promise<Attachment[]> {
  if (!files.length) return [];
  return Promise.all(files.map((file) => uploadAttachment(pathPrefix, file)));
}

export async function deleteStoredAttachment(attachment: Attachment): Promise<void> {
  if (!attachment.storagePath) return;

  try {
    await deleteObject(ref(storage, attachment.storagePath));
  } catch (error) {
    const err = error as { code?: string };
    if (err.code !== 'storage/object-not-found') {
      throw error;
    }
  }
}

export async function deleteStoredAttachments(attachments: Attachment[]): Promise<void> {
  for (const attachment of attachments) {
    await deleteStoredAttachment(attachment);
  }
}
