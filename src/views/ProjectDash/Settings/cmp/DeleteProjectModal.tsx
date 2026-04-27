import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../../components/Modal/Modal';
import { Btn } from '../../../../components/Btn/Btn';
import { deleteProject } from '../../../../db/projects/projectRepo';
import { removeProject } from '../../../../db/projects/projectsSlice';
import { useAppDispatch } from '../../../../store';
import { toast } from '../../../../components/toast/toast';

interface Props {
  show: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const DeleteProjectModal = ({ show, onClose, projectId, projectName }: Props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const expected = projectName.toLowerCase();
  const confirmed = input === expected;

  const handleClose = () => {
    setInput('');
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmed) return;
    setLoading(true);
    try {
      await deleteProject(projectId);
      dispatch(removeProject(projectId));
      toast.success('Progetto eliminato');
      navigate('/home');
    } catch {
      toast.error('Errore durante l\'eliminazione');
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onClose={handleClose}
      title="Elimina progetto"
      centered
      size="sm"
      footer={
        <>
          <Btn version="outline" color="secondary" onClick={handleClose} disabled={loading}>
            Annulla
          </Btn>
          <Btn color="danger" onClick={handleDelete} loading={loading} disabled={!confirmed}>
            Elimina
          </Btn>
        </>
      }
    >
      <p className="text-muted mb-3" style={{ fontSize: '0.88rem' }}>
        Questa azione è <strong>irreversibile</strong>. Verranno eliminati tutti i dati del progetto,
        incluse task e notifiche.
      </p>
      <p className="mb-2" style={{ fontSize: '0.88rem' }}>
        Per confermare, digita <strong>"{expected}"</strong>
      </p>
      <input
        type="text"
        className="form-control"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={expected}
        autoFocus
      />
    </Modal>
  );
};

export default DeleteProjectModal;
