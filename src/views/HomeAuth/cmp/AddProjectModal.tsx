import { useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Btn } from '../../../components/Btn/Btn';
import { createProject } from '../../../db/projects/projectRepo';
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);
    try {
      console.log('[createProject] uid:', user.uid);
      const newId = await createProject({
        name: name.trim(),
        description: description.trim(),
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
      console.log('[createProject] done, id:', newId);
      toast.success('Progetto creato');
      setName('');
      setDescription('');
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
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. My App"
            required
            autoFocus
          />
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
