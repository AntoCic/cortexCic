import type { ChangeEvent, MouseEvent, PointerEvent } from 'react';
import { useId, useState } from 'react';
import type { Attachment } from '../../db/attachments/Attachment';
import { formatAttachmentSize, isImageAttachment, isPdfAttachment } from '../../db/attachments/attachmentUtils';
import ImagePreviewModal from '../ImagePreviewModal/ImagePreviewModal';
import styles from './AttachmentPanel.module.css';

interface Props {
  attachments: Attachment[];
  title?: string;
  hint?: string;
  compact?: boolean;
  hideHeader?: boolean;
  uploading?: boolean;
  onAddFiles?: (files: File[]) => void | Promise<void>;
  onRemove?: (attachment: Attachment) => void | Promise<void>;
}

function stopBubbling(event: MouseEvent | PointerEvent) {
  event.stopPropagation();
}

const AttachmentPanel = ({
  attachments,
  title = 'Allegati',
  hint,
  compact = false,
  hideHeader = false,
  uploading = false,
  onAddFiles,
  onRemove,
}: Props) => {
  const inputId = useId();
  const [preview, setPreview] = useState<Attachment | null>(null);

  const imageAttachments = attachments.filter(isImageAttachment);
  const fileAttachments = attachments.filter((attachment) => !isImageAttachment(attachment));

  const handleFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (!files.length || !onAddFiles) return;
    await onAddFiles(files);
  };

  return (
    <div className={`${styles.root}${compact ? ` ${styles.compact}` : ''}`}>
      {!hideHeader && (
        <div className={styles.header}>
          <div>
            <div className={styles.title}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
              {title}
            </div>
            {hint && <div className={styles.hint}>{hint}</div>}
          </div>
          {onAddFiles && (
            <>
              <input
                id={inputId}
                type="file"
                className="d-none"
                multiple
                onChange={handleFilesChange}
              />
              <label htmlFor={inputId} className={styles.uploadBtn} aria-disabled={uploading}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {uploading ? 'hourglass_top' : 'upload_file'}
                </span>
                {uploading ? 'Caricamento…' : 'Aggiungi file'}
              </label>
            </>
          )}
        </div>
      )}

      {hideHeader && onAddFiles && (
        <>
          <input
            id={inputId}
            type="file"
            className="d-none"
            multiple
            onChange={handleFilesChange}
          />
          <label htmlFor={inputId} className={styles.uploadBtn} aria-disabled={uploading}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {uploading ? 'hourglass_top' : 'upload_file'}
            </span>
            {uploading ? 'Caricamento…' : 'Aggiungi file'}
          </label>
        </>
      )}

      {!attachments.length && <div className={styles.empty}>Nessun allegato</div>}

      {imageAttachments.length > 0 && (
        <div className={styles.images}>
          {imageAttachments.map((attachment) => (
            <div key={attachment.id} className={styles.imageCard}>
              {onRemove && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={(event) => {
                    stopBubbling(event);
                    void onRemove(attachment);
                  }}
                  onPointerDown={stopBubbling}
                  title="Rimuovi allegato"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              )}
              <button
                type="button"
                className={styles.imageBtn}
                onClick={(event) => {
                  stopBubbling(event);
                  setPreview(attachment);
                }}
                onPointerDown={stopBubbling}
                title={attachment.name}
              >
                <img src={attachment.downloadURL} alt={attachment.name} className={styles.imageThumb} />
              </button>
              <div className={styles.imageMeta}>
                <span className={styles.imageName}>{attachment.name}</span>
                <span className={styles.imageSize}>{formatAttachmentSize(attachment.size)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {fileAttachments.length > 0 && (
        <div className={styles.files}>
          {fileAttachments.map((attachment) => {
            const isPdf = isPdfAttachment(attachment);
            const actionLabel = isPdf ? 'Apri PDF' : 'Scarica file';
            const hrefProps = isPdf
              ? { target: '_blank', rel: 'noopener noreferrer' as const }
              : { download: attachment.name };

            return (
              <div key={attachment.id} className={styles.fileRow}>
                <div className={styles.fileIcon}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {isPdf ? 'picture_as_pdf' : 'draft'}
                  </span>
                </div>
                <div className={styles.fileInfo}>
                  <a
                    href={attachment.downloadURL}
                    className={styles.fileName}
                    onClick={stopBubbling}
                    onPointerDown={stopBubbling}
                    {...hrefProps}
                  >
                    {attachment.name}
                  </a>
                  <span className={styles.fileMeta}>
                    {formatAttachmentSize(attachment.size)} · {isPdf ? 'PDF' : 'File'}
                  </span>
                </div>
                <div className={styles.fileActions}>
                  <a
                    href={attachment.downloadURL}
                    className={styles.fileAction}
                    title={actionLabel}
                    onClick={stopBubbling}
                    onPointerDown={stopBubbling}
                    {...hrefProps}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {isPdf ? 'open_in_new' : 'download'}
                    </span>
                  </a>
                  {onRemove && (
                    <button
                      type="button"
                      className={styles.fileAction}
                      title="Rimuovi allegato"
                      onClick={(event) => {
                        stopBubbling(event);
                        void onRemove(attachment);
                      }}
                      onPointerDown={stopBubbling}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImagePreviewModal
        imageUrl={preview?.downloadURL ?? null}
        imageName={preview?.name}
        onClose={() => setPreview(null)}
      />
    </div>
  );
};

export default AttachmentPanel;
