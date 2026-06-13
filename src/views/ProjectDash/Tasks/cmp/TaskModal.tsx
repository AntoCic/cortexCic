import type { CSSProperties, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../../../../components/Modal/Modal';
import AttachmentPanel from '../../../../components/AttachmentPanel/AttachmentPanel';
import { Btn } from '../../../../components/Btn/Btn';
import { TaskCategory, TASK_CATEGORY_ICONS, TASK_CATEGORY_LABELS } from '../../../../enums/TaskCategory';
import type { TaskCategoryValue } from '../../../../enums/TaskCategory';
import { TaskStatus } from '../../../../enums/TaskStatus';
import type { TaskStatusValue } from '../../../../enums/TaskStatus';
import { TaskUrgency } from '../../../../enums/TaskUrgency';
import type { TaskUrgencyValue } from '../../../../enums/TaskUrgency';
import type { Attachment } from '../../../../db/attachments/Attachment';
import { getAttachmentKind } from '../../../../db/attachments/attachmentUtils';
import type { Task } from '../../../../db/tasks/Task';
import styles from './TaskModal.module.css';

interface PendingAttachment extends Attachment {
  file: File;
  pending: true;
}

export interface TaskModalValue {
  title: string;
  description: string;
  status: TaskStatusValue;
  urgency: TaskUrgencyValue;
  category: TaskCategoryValue;
  keptAttachments: Attachment[];
  removedAttachments: Attachment[];
  newFiles: File[];
}

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (data: TaskModalValue) => Promise<void>;
  initial?: Task | null;
}

type OptionCard = {
  value: string;
  label: string;
  description: string;
  icon: string;
  color: string;
};

const STATUS_OPTIONS: Array<OptionCard & { value: TaskStatusValue }> = [
  { value: TaskStatus.Todo, label: 'To Do', description: 'Da iniziare o ancora da definire.', icon: 'schedule', color: '#6c757d' },
  { value: TaskStatus.InProgress, label: 'In Progress', description: 'Task in lavorazione in questo momento.', icon: 'play_circle', color: '#4c6ef5' },
  { value: TaskStatus.Done, label: 'Done', description: 'Completata e pronta da chiudere.', icon: 'task_alt', color: '#12b886' },
  { value: TaskStatus.Block, label: 'Blocked', description: 'Ferma per dipendenze o impedimenti.', icon: 'block', color: '#e03131' },
];

const URGENCY_OPTIONS: Array<OptionCard & { value: TaskUrgencyValue }> = [
  { value: TaskUrgency.Low, label: 'Bassa', description: 'Può aspettare senza creare attrito.', icon: 'routine', color: '#2b8a3e' },
  { value: TaskUrgency.Medium, label: 'Normale', description: 'Flusso standard, priorità di default.', icon: 'radio_button_checked', color: '#f08c00' },
  { value: TaskUrgency.High, label: 'Alta', description: 'Meglio farla presto per non rallentare.', icon: 'priority_high', color: '#e8590c' },
  { value: TaskUrgency.Critical, label: 'Critica', description: 'Serve attenzione immediata.', icon: 'local_fire_department', color: '#c92a2a' },
];

const CATEGORY_OPTIONS: Array<OptionCard & { value: TaskCategoryValue }> = [
  { value: TaskCategory.Feature, label: TASK_CATEGORY_LABELS.feature, description: 'Nuova funzionalità da progettare o implementare.', icon: TASK_CATEGORY_ICONS.feature, color: '#6c63ff' },
  { value: TaskCategory.Bug, label: TASK_CATEGORY_LABELS.bug, description: 'Problema da correggere o comportamento anomalo.', icon: TASK_CATEGORY_ICONS.bug, color: '#e03131' },
  { value: TaskCategory.Spike, label: TASK_CATEGORY_LABELS.spike, description: 'Analisi tecnica o verifica di fattibilità.', icon: TASK_CATEGORY_ICONS.spike, color: '#0c8599' },
];

function createPendingAttachment(file: File): PendingAttachment {
  return {
    id: `pending-${crypto.randomUUID()}`,
    name: file.name,
    downloadURL: URL.createObjectURL(file),
    storagePath: '',
    contentType: file.type || 'application/octet-stream',
    size: file.size,
    kind: getAttachmentKind(file.name, file.type),
    uploadedAt: new Date().toISOString(),
    file,
    pending: true,
  };
}

function revokePendingAttachments(items: PendingAttachment[]) {
  items.forEach((item) => URL.revokeObjectURL(item.downloadURL));
}

interface SelectorProps<T extends string> {
  label: string;
  options: Array<OptionCard & { value: T }>;
  value: T;
  columnsClassName: string;
  onChange: (value: T) => void;
}

const OptionSelector = <T extends string>({ label, options, value, columnsClassName, onChange }: SelectorProps<T>) => (
  <div className={styles.section}>
    <p className={styles.sectionLabel}>{label}</p>
    <div className={`${styles.optionGrid} ${columnsClassName}`}>
      {options.map((option) => {
        const active = option.value === value;
        const inlineStyle = { '--option-color': option.color } as CSSProperties;

        return (
          <button
            key={option.value}
            type="button"
            className={`${styles.optionCard} ${active ? styles.optionCardActive : ''}`}
            style={inlineStyle}
            onClick={() => onChange(option.value)}
          >
            <span className={styles.optionIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{option.icon}</span>
            </span>
            <span className={styles.optionContent}>
              <span className={styles.optionTitle}>{option.label}</span>
              <span className={styles.optionDesc}>{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const TaskModal = ({ show, onClose, onSave, initial }: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatusValue>(TaskStatus.Todo);
  const [urgency, setUrgency] = useState<TaskUrgencyValue>(TaskUrgency.Medium);
  const [category, setCategory] = useState<TaskCategoryValue>(TaskCategory.Feature);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [removedAttachments, setRemovedAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(() => {
    if (!show) return;

    revokePendingAttachments(pendingAttachmentsRef.current);
    setPendingAttachments([]);
    setRemovedAttachments([]);
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setStatus(initial?.status ?? TaskStatus.Todo);
    setUrgency(initial?.urgency ?? TaskUrgency.Medium);
    setCategory(initial?.category ?? TaskCategory.Feature);
    setAttachments(initial?.attachments ?? []);
  }, [show, initial]);

  useEffect(() => () => revokePendingAttachments(pendingAttachmentsRef.current), []);

  const combinedAttachments = useMemo<Attachment[]>(
    () => [...attachments, ...pendingAttachments],
    [attachments, pendingAttachments],
  );

  const handleAddFiles = async (files: File[]) => {
    setPendingAttachments((prev) => [...prev, ...files.map(createPendingAttachment)]);
  };

  const handleRemoveAttachment = async (attachment: Attachment) => {
    if (attachment.id.startsWith('pending-')) {
      setPendingAttachments((prev) => {
        const next = prev.filter((item) => item.id !== attachment.id);
        const removed = prev.find((item) => item.id === attachment.id);
        if (removed) {
          URL.revokeObjectURL(removed.downloadURL);
        }
        return next;
      });
      return;
    }

    setAttachments((prev) => prev.filter((item) => item.id !== attachment.id));
    setRemovedAttachments((prev) => [...prev, attachment]);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
        urgency,
        category,
        keptAttachments: attachments,
        removedAttachments,
        newFiles: pendingAttachments.map((item) => item.file),
      });
      revokePendingAttachments(pendingAttachmentsRef.current);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClose = () => {
    revokePendingAttachments(pendingAttachmentsRef.current);
    onClose();
  };

  return (
    <Modal
      show={show}
      onClose={handleRequestClose}
      title={initial ? 'Modifica task' : 'Nuova task'}
      size="xl"
      centered
      scrollable
      footer={(
        <>
          <Btn version="outline" color="secondary" onClick={handleRequestClose} disabled={loading}>Annulla</Btn>
          <Btn color="primary" onClick={handleSave as never} loading={loading}>Salva</Btn>
        </>
      )}
    >
      <form onSubmit={handleSave} className={styles.shell}>
        <div className={styles.hero}>
          <h3 className={styles.heroTitle}>Imposta contesto e priorità della task</h3>
          <p className={styles.heroText}>
            Stato, urgenza e categoria restano sempre visibili qui sotto, così scegli al volo senza menu nascosti.
          </p>
        </div>

        <div className="mb-0">
          <label className="form-label fw-semibold">Titolo</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Cosa c'è da fare?"
            required
            autoFocus
          />
        </div>

        <div className="mb-0">
          <label className="form-label fw-semibold">
            Descrizione <span className="text-muted fw-normal">(opzionale)</span>
          </label>
          <textarea
            className="form-control"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </div>

        <OptionSelector
          label="Stato"
          options={STATUS_OPTIONS}
          value={status}
          columnsClassName={styles.optionGrid4}
          onChange={setStatus}
        />

        <OptionSelector
          label="Urgenza"
          options={URGENCY_OPTIONS}
          value={urgency}
          columnsClassName={styles.optionGrid4}
          onChange={setUrgency}
        />

        <OptionSelector
          label="Categoria"
          options={CATEGORY_OPTIONS}
          value={category}
          columnsClassName={styles.optionGrid3}
          onChange={setCategory}
        />

        <AttachmentPanel
          attachments={combinedAttachments}
          title="Allegati task"
          hint="Puoi caricare immagini, PDF o file generici. Le immagini restano visibili in preview."
          onAddFiles={handleAddFiles}
          onRemove={handleRemoveAttachment}
        />
      </form>
    </Modal>
  );
};

export default TaskModal;
