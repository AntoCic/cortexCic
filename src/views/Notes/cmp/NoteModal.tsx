import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Modal } from '../../../components/Modal/Modal';
import { Btn } from '../../../components/Btn/Btn';
import { NoteType, NoteTypeLabel } from '../../../enums/NoteType';
import type { NoteTypeValue } from '../../../enums/NoteType';
import type { Note } from '../../../db/notes/Note';

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

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; type?: NoteTypeValue; tags?: string[] }) => Promise<void>;
  initial?: Note | null;
}

const NoteModal = ({ show, onClose, onSave, initial }: Props) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NoteTypeValue | ''>('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setTitle(initial?.title ?? '');
      setContent(initial?.content ?? '');
      setType(initial?.type ?? '');
      setTagsRaw(initial?.tags?.join(', ') ?? '');
    }
  }, [show, initial]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const tags = tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await onSave({
        title: title.trim(),
        content,
        type: type || undefined,
        tags: tags.length ? tags : undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initial;

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={isEditing ? 'Modifica nota' : 'Nuova nota'}
      size="lg"
      scrollable
      centered
      footer={
        <>
          <Btn version="outline" color="secondary" onClick={onClose} disabled={loading}>
            Annulla
          </Btn>
          <Btn color="primary" onClick={handleSave} loading={loading} disabled={!title.trim()}>
            {isEditing ? 'Salva modifiche' : 'Crea nota'}
          </Btn>
        </>
      }
    >
      <div className="mb-3">
        <label className="form-label fw-semibold">Titolo</label>
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
            Tag <span className="text-muted fw-normal">(separati da virgola)</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="es. react, backend, idee"
          />
        </div>
      </div>

      <div className="mb-1">
        <label className="form-label fw-semibold">Contenuto</label>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          modules={QUILL_MODULES}
          style={{ minHeight: 220 }}
        />
      </div>
    </Modal>
  );
};

export default NoteModal;
