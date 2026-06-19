import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import AttachmentPanel from '../../../components/AttachmentPanel/AttachmentPanel';
import { noteContentToPlainText } from '../../../db/notes/noteContent';
import { NoteTypeLabel, NoteTypeColor } from '../../../enums/NoteType';
import type { Note } from '../../../db/notes/Note';
import styles from '../Notes.module.css';

interface Props {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

function formatDate(ts: Note['updatedAt']): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date((ts as unknown as { seconds: number }).seconds * 1000);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const NoteCard = ({ note, onEdit, onDelete }: Props) => {
  const [copied, setCopied] = useState(false);

  const stopCardClick = (event: ReactMouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handleCopy = () => {
    const text = noteContentToPlainText(note.content);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const plainContent = noteContentToPlainText(note.content);
  const preview = plainContent.slice(0, 160).trim();

  return (
    <article
      className={styles.noteCard}
      onClick={() => onEdit(note)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onEdit(note);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className={styles.noteCardTop}>
        <div className={styles.noteCardMeta}>
          {note.type && (
            <span
              className={styles.typeBadge}
              style={{ background: NoteTypeColor[note.type] + '1a', color: NoteTypeColor[note.type] }}
            >
              {NoteTypeLabel[note.type]}
            </span>
          )}
          <span className={styles.noteDate}>{formatDate(note.updatedAt)}</span>
        </div>
        {note.title && <h3 className={styles.noteTitle}>{note.title}</h3>}
        {preview && <p className={styles.notePreview}>{preview}{plainContent.length > 160 ? '…' : ''}</p>}
        {note.tags && note.tags.length > 0 && (
          <div className={styles.tagList}>
            {note.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {note.link && (
        <a
          href={note.link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.noteLink}
          onClick={stopCardClick}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 4 }}>link</span>
          {note.link}
        </a>
      )}

      {!!note.attachments?.length && (
        <div className={styles.noteAttachments}>
          <AttachmentPanel attachments={note.attachments} compact hideHeader />
        </div>
      )}

      <div className={styles.noteCardActions}>
        <button className={styles.actionBtn} onClick={(event) => { stopCardClick(event); handleCopy(); }} title="Copia contenuto">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Copiato' : 'Copia'}
        </button>
        <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={(event) => { stopCardClick(event); onDelete(note); }} title="Elimina">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
        </button>
      </div>
    </article>
  );
};

export default NoteCard;
