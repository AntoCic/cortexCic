import { useEffect, useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Btn } from '../../../components/Btn/Btn';
import { toast } from '../../../components/toast/toast';
import styles from './CreateLinkNoteModal.module.css';

interface Props {
  show: boolean;
  onClose: () => void;
  onCreate: (data: { title?: string; link: string }) => Promise<void>;
}

const CreateLinkNoteModal = ({ show, onClose, onCreate }: Props) => {
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setTitle('');
    setLink('');
    setLoading(false);
  }, [show]);

  const handleCopy = async () => {
    if (!link.trim()) return;

    try {
      await navigator.clipboard.writeText(link.trim());
      toast.success('Link copiato');
    } catch {
      toast.error('Copia link non riuscita');
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) return;
      setLink(clipboardText.trim());
    } catch {
      toast.error('Incolla non disponibile');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!link.trim()) {
      toast.error('Inserisci un link');
      return;
    }

    setLoading(true);

    try {
      await onCreate({
        title: title.trim() || undefined,
        link: link.trim(),
      });
    } catch {
      toast.error('Creazione link non riuscita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Aggiungi link"
      centered
      footer={(
        <>
          <Btn version="outline" color="secondary" onClick={onClose} disabled={loading}>
            Annulla
          </Btn>
          <Btn color="primary" onClick={handleSubmit as never} loading={loading}>
            Crea link
          </Btn>
        </>
      )}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold">
            Titolo <span className="text-muted fw-normal">(opzionale)</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Es. Docs deploy"
            autoFocus
          />
        </div>

        <div className="mb-1">
          <label className="form-label fw-semibold d-flex align-items-center justify-content-between gap-2">
            <span>Link</span>
            <span className={styles.fieldActions}>
              <button type="button" className={styles.iconBtn} onClick={handlePaste} title="Incolla link">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_paste</span>
              </button>
              <button type="button" className={styles.iconBtn} onClick={handleCopy} title="Copia link">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
              </button>
            </span>
          </label>

          <div className={styles.linkRow}>
            <input
              type="url"
              className={`form-control ${styles.linkInput}`}
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://…"
              required
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateLinkNoteModal;
