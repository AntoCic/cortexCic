import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Modal } from '../../../components/Modal/Modal';
import { Btn } from '../../../components/Btn/Btn';
import { NoteType, NoteTypeLabel, NoteTypeColor } from '../../../enums/NoteType';
import type { NoteTypeValue } from '../../../enums/NoteType';
import type { Note } from '../../../db/notes/Note';
import styles from './NoteModal.module.css';

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

const PRESET_TAGS = ['frontend', 'backend', 'lexhero', 'react', 'vue', 'docker'];

function isContentEmpty(html: string): boolean {
  return !html || !html.replace(/<[^>]*>/g, '').trim();
}

function linkOrigin(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (data: { title?: string; content: string; type?: NoteTypeValue; tags?: string[]; link?: string }) => Promise<void>;
  initial?: Note | null;
}

const NoteModal = ({ show, onClose, onSave, initial }: Props) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NoteTypeValue | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (show) {
      setTitle(initial?.title ?? '');
      setContent(initial?.content ?? '');
      setType(initial?.type ?? '');
      setLink(initial?.link ?? '');
      setTags(initial?.tags ?? []);
      setEditOpen(!initial);
    }
  }, [show, initial]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSave = async () => {
    if (isContentEmpty(content)) return;
    setLoading(true);
    try {
      const extraTags = tags.filter((t) => !PRESET_TAGS.includes(t));
      const allTags = [...tags.filter((t) => PRESET_TAGS.includes(t)), ...extraTags];
      await onSave({
        title: title.trim() || undefined,
        content,
        type: type || undefined,
        tags: allTags.length ? allTags : undefined,
        link: link.trim() || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initial;
  const canSave = !isContentEmpty(content);
  const hasInfo = !!(title || type || link || tags.length);

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={isEditing ? 'Modifica nota' : 'Nuova nota'}
      fullscreen
      scrollable
      footer={
        <>
          <Btn version="outline" color="secondary" onClick={onClose} disabled={loading}>
            Annulla
          </Btn>
          <Btn color="primary" onClick={handleSave} loading={loading} disabled={!canSave}>
            {isEditing ? 'Salva modifiche' : 'Crea nota'}
          </Btn>
        </>
      }
    >
      {/* Info bar — always visible */}
      <div className={styles.infoBar}>
        <div className={styles.infoContent}>
          {title && <span className={styles.infoTitle}>{title}</span>}
          {type && (
            <span
              className={styles.infoBadge}
              style={{ background: NoteTypeColor[type] + '1a', color: NoteTypeColor[type] }}
            >
              {NoteTypeLabel[type]}
            </span>
          )}
          {link && (
            <span className={styles.infoBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: 12, lineHeight: 1 }}>link</span>
              {linkOrigin(link)}
            </span>
          )}
          {tags.map((tag) => (
            <span key={tag} className={styles.infoTag}>{tag}</span>
          ))}
          {!hasInfo && (
            <span className={styles.infoEmpty}>Nessun dettaglio aggiunto</span>
          )}
        </div>
        <button
          type="button"
          className={`${styles.editToggleBtn} ${editOpen ? styles.editToggleBtnActive : ''}`}
          onClick={() => setEditOpen((v) => !v)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>
            {editOpen ? 'keyboard_arrow_up' : 'edit'}
          </span>
          {editOpen ? 'Chiudi' : 'Modifica'}
        </button>
      </div>

      {/* Collapsible edit section */}
      {editOpen && (
        <div className={styles.editSection}>
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Titolo <span className="text-muted fw-normal">(opzionale)</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titolo della nota"
              autoFocus
            />
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Tipo <span className="text-muted fw-normal">(opzionale)</span>
              </label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value as NoteTypeValue | '')}
              >
                <option value="">Nessuno</option>
                {Object.values(NoteType).map((t) => (
                  <option key={t} value={t}>{NoteTypeLabel[t]}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Link <span className="text-muted fw-normal">(opzionale)</span>
              </label>
              <input
                type="url"
                className="form-control"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <div>
            <label className="form-label fw-semibold">
              Tag <span className="text-muted fw-normal">(opzionale)</span>
            </label>
            <div className={styles.tagList}>
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.tagChip} ${tags.includes(tag) ? styles.tagChipActive : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tags.includes(tag) && (
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check</span>
                  )}
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content editor */}
      <div className={styles.quillWrap}>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={QUILL_MODULES}
        />
      </div>
    </Modal>
  );
};

export default NoteModal;
