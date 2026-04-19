import { useState, useEffect } from 'react';
import { Modal } from '../../../../components/Modal/Modal';
import { Btn } from '../../../../components/Btn/Btn';
import { TaskStatus } from '../../../../enums/TaskStatus';
import type { TaskStatusValue } from '../../../../enums/TaskStatus';
import type { Task } from '../../../../db/tasks/Task';

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description: string; status: TaskStatusValue }) => Promise<void>;
  initial?: Task | null;
}

const STATUS_OPTIONS: { value: TaskStatusValue; label: string }[] = [
  { value: TaskStatus.Todo, label: 'To Do' },
  { value: TaskStatus.InProgress, label: 'In Progress' },
  { value: TaskStatus.Done, label: 'Done' },
  { value: TaskStatus.Block, label: 'Blocked' },
];

const TaskModal = ({ show, onClose, onSave, initial }: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatusValue>(TaskStatus.Todo);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setTitle(initial?.title ?? '');
      setDescription(initial?.description ?? '');
      setStatus(initial?.status ?? TaskStatus.Todo);
    }
  }, [show, initial]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSave({ title: title.trim(), description: description.trim(), status });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={initial ? 'Modifica task' : 'Nuova task'}
      centered
      footer={
        <>
          <Btn version="outline" color="secondary" onClick={onClose} disabled={loading}>Annulla</Btn>
          <Btn color="primary" onClick={handleSave as never} loading={loading}>Salva</Btn>
        </>
      }
    >
      <form onSubmit={handleSave}>
        <div className="mb-3">
          <label className="form-label fw-semibold">Titolo</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Cosa c'è da fare?"
            required
            autoFocus
          />
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold">Descrizione <span className="text-muted fw-normal">(opzionale)</span></label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <label className="form-label fw-semibold">Stato</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatusValue)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
