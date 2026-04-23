import { useState } from 'react';
import { NoteTypeLabel, NoteTypeColor } from '../../../enums/NoteType';
import type { Note } from '../../../db/notes/Note';
import styles from '../Notes.module.css';

interface Props {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent ?? div.innerText ?? '';
}

function formatDate(ts: Note['updatedAt']): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date((ts as unknown as { seconds: number }).seconds * 1000);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const NoteCard = ({ note, onEdit, onDelete }: Props) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = stripHtml(note.content);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const preview = stripHtml(note.content).slice(0, 160).trim();

  return (
    <div className={styles.noteCard}>
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
        <h3 className={styles.noteTitle}>{note.title}</h3>
        {preview && <p className={styles.notePreview}>{preview}{stripHtml(note.content).length > 160 ? '…' : ''}</p>}
        {note.tags && note.tags.length > 0 && (
          <div className={styles.tagList}>
            {note.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.noteCardActions}>
        <button className={styles.actionBtn} onClick={handleCopy} title="Copia contenuto">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Copiato' : 'Copia'}
        </button>
        <button className={styles.actionBtn} onClick={() => onEdit(note)} title="Modifica">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
          Modifica
        </button>
        <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => onDelete(note)} title="Elimina">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
        </button>
      </div>
    </div>
  );
};

export default NoteCard;
