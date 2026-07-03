import { useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Btn } from '../../../components/Btn/Btn';
import { createProject } from '../../../db/projects/projectRepo';
import {
  getProjectIdentifierError,
  normalizeProjectIdentifierInput,
  suggestProjectIdentifier,
} from '../../../db/projects/projectIdentifier';
import { useAuth } from '../../../db/auth/useAuth';
import { MemberRole } from '../../../enums/MemberRole';
import { toast } from '../../../components/toast/toast';
import type { Timestamp } from 'firebase/firestore';
import { Timestamp as FsTimestamp } from 'firebase/firestore';

interface Props {
  show: boolean;
  onClose: () => void;
}

const AddProjectModal = ({ show, onClose }: Props) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState(false);

  const suggestedIdentifier = suggestProjectIdentifier(name);

  const identifierError = getProjectIdentifierError(identifier);

  const handleNameChange = (value: string) => {
    setName(value);
    if (value.trim()) setNameError(false);

    if (!identifierTouched || identifier === suggestedIdentifier) {
      setIdentifier(suggestProjectIdentifier(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setNameError(true);
      toast.error('Il nome del progetto è obbligatorio');
      return;
    }
    if (identifierError) {
      toast.error(identifierError);
      return;
    }
    setLoading(true);
    try {
      await createProject({
        name: name.trim(),
        description: description.trim(),
        identifier,
        ownerId: user.uid,
        members: {
          [user.uid]: {
            email: user.email ?? '',
            role: MemberRole.Admin,
            addedAt: FsTimestamp.now() as Timestamp,
          },
        },
        memberUids: [user.uid],
        apiKey: crypto.randomUUID(),
      });
      toast.success('Progetto creato');
      setName('');
      setDescription('');
      setIdentifier('');
      setIdentifierTouched(false);
      onClose();
    } catch (err) {
      console.error('[createProject] error:', err);
      toast.error('Errore nella creazione del progetto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Nuovo progetto"
      centered
      footer={
        <>
          <Btn version="outline" color="secondary" onClick={onClose} disabled={loading}>
            Annulla
          </Btn>
          <Btn color="primary" onClick={handleSubmit as never} loading={loading}>
            Crea progetto
          </Btn>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold">Nome progetto</label>
          <input
            type="text"
            className={`form-control ${nameError ? 'is-invalid' : ''}`}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="es. My App"
            required
            autoFocus
          />
          {nameError && <div className="invalid-feedback">Il nome del progetto è obbligatorio</div>}
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold">Identificativo progetto</label>
          <input
            type="text"
            className="form-control text-uppercase"
            value={identifier}
            onChange={(e) => {
              setIdentifierTouched(true);
              setIdentifier(normalizeProjectIdentifierInput(e.target.value));
            }}
            placeholder={suggestedIdentifier}
            required
            maxLength={4}
          />
          <div className="form-text">
            2-4 lettere maiuscole. Suggerito: <strong>{suggestedIdentifier}</strong>
          </div>
        </div>
        <div className="mb-1">
          <label className="form-label fw-semibold">Descrizione <span className="text-muted fw-normal">(opzionale)</span></label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Una breve descrizione del progetto..."
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddProjectModal;
