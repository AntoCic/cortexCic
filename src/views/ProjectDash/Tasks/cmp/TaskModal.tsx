import type { CSSProperties, DragEvent, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../../../../components/Modal/Modal';
import AttachmentPanel from '../../../../components/AttachmentPanel/AttachmentPanel';
import { Btn } from '../../../../components/Btn/Btn';
import { toast } from '../../../../components/toast/toast';
import { TaskCategory, TASK_CATEGORY_ICONS, TASK_CATEGORY_LABELS } from '../../../../enums/TaskCategory';
import type { TaskCategoryValue } from '../../../../enums/TaskCategory';
import { TaskStatus } from '../../../../enums/TaskStatus';
import type { TaskStatusValue } from '../../../../enums/TaskStatus';
import { TaskUrgency } from '../../../../enums/TaskUrgency';
import type { TaskUrgencyValue } from '../../../../enums/TaskUrgency';
import type { Attachment } from '../../../../db/attachments/Attachment';
import { getAttachmentKind } from '../../../../db/attachments/attachmentUtils';
import type { Task } from '../../../../db/tasks/Task';
import { formatTaskTitle } from '../../../../db/tasks/taskTitle';
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
  projectIdentifier?: string;
  nextSerialNumber?: number;
  showOnboardingHint?: boolean;
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

async function copyFieldValue(value: string, successMessage: string) {
  if (!value.trim()) return;

  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error('Copia non riuscita');
  }
}

async function pasteIntoField(onPaste: (value: string) => void) {
  try {
    const value = await navigator.clipboard.readText();
    if (!value) return;
    onPaste(value);
  } catch {
    toast.error('Incolla non disponibile');
  }
}

interface SelectorProps<T extends string> {
  label: string;
  options: Array<OptionCard & { value: T }>;
  value: T;
  columnsClassName: string;
  compact?: boolean;
  onChange: (value: T) => void;
}

const OptionSelector = <T extends string>({
  label,
  options,
  value,
  columnsClassName,
  compact = false,
  onChange,
}: SelectorProps<T>) => (
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
            className={`${styles.optionCard} ${compact ? styles.optionCardCompact : ''} ${active ? styles.optionCardActive : ''}`}
            style={inlineStyle}
            onClick={() => onChange(option.value)}
          >
            <span className={styles.optionIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: compact ? 18 : 20 }}>{option.icon}</span>
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

const TaskModal = ({
  show,
  onClose,
  onSave,
  initial,
  projectIdentifier,
  nextSerialNumber = 1,
  showOnboardingHint = false,
}: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatusValue>(TaskStatus.Todo);
  const [urgency, setUrgency] = useState<TaskUrgencyValue>(TaskUrgency.Medium);
  const [category, setCategory] = useState<TaskCategoryValue>(TaskCategory.Feature);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [removedAttachments, setRemovedAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(() => {
    if (!show) return;

    revokePendingAttachments(pendingAttachmentsRef.current);
    setPendingAttachments([]);
    setRemovedAttachments([]);
    setTitle(initial?.customTitle ?? initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setStatus(initial?.status ?? TaskStatus.Todo);
    setUrgency(initial?.urgency ?? TaskUrgency.Medium);
    setCategory(initial?.category ?? TaskCategory.Feature);
    setAttachments(initial?.attachments ?? []);
    setDropzoneActive(false);
  }, [show, initial]);

  useEffect(() => () => revokePendingAttachments(pendingAttachmentsRef.current), []);

  const combinedAttachments = useMemo<Attachment[]>(
    () => [...attachments, ...pendingAttachments],
    [attachments, pendingAttachments],
  );

  const titlePrefix = initial
    ? (initial.projectIdentifier && initial.serialNumber
      ? `${initial.projectIdentifier}-${initial.serialNumber}-`
      : '')
    : (projectIdentifier ? `${projectIdentifier}-${nextSerialNumber}-` : '');

  const previewTitle = title.trim()
    ? formatTaskTitle(
      initial
        ? initial.projectIdentifier
        : projectIdentifier,
      initial
        ? initial.serialNumber
        : (projectIdentifier ? nextSerialNumber : undefined),
      title.trim(),
    )
    : '';

  const handleAddFiles = async (files: File[]) => {
    setPendingAttachments((prev) => [...prev, ...files.map(createPendingAttachment)]);
  };

  const handleDropFiles = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDropzoneActive(false);

    const files = Array.from(event.dataTransfer.files ?? []);
    if (!files.length) return;

    await handleAddFiles(files);
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
        {showOnboardingHint && (
          <div className={styles.hero}>
            <h3 className={styles.heroTitle}>Imposta contesto e priorità della task</h3>
            <p className={styles.heroText}>
              Stato, urgenza e categoria restano sempre visibili qui sotto, così scegli al volo senza menu nascosti.
            </p>
          </div>
        )}

        <OptionSelector
          label="Categoria"
          options={CATEGORY_OPTIONS}
          value={category}
          columnsClassName={styles.optionGrid3}
          onChange={setCategory}
        />

        <div className={styles.fieldGroup}>
          <label className={styles.fieldHeader}>
            <span className={styles.fieldLabel}>Titolo</span>
            <span className={styles.fieldActions}>
              <button
                type="button"
                className={styles.fieldActionBtn}
                onClick={() => { void pasteIntoField((value) => setTitle(value)); }}
                title="Incolla titolo"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_paste</span>
              </button>
              <button
                type="button"
                className={styles.fieldActionBtn}
                onClick={() => { void copyFieldValue(previewTitle || title, 'Titolo copiato'); }}
                title="Copia titolo"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
              </button>
            </span>
          </label>

          <div className={styles.titleComposer}>
            {titlePrefix && <span className={styles.titlePrefix}>{titlePrefix}</span>}
            <input
              type="text"
              className={`form-control ${styles.titleInput}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={titlePrefix ? 'titolo task' : 'Cosa c\'è da fare?'}
              required
              autoFocus
            />
          </div>

          {previewTitle && titlePrefix && (
            <div className={styles.titlePreview}>{previewTitle}</div>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldHeader}>
            <span className={styles.fieldLabel}>
              Descrizione <span className={styles.fieldOptional}>(opzionale)</span>
            </span>
            <span className={styles.fieldActions}>
              <button
                type="button"
                className={styles.fieldActionBtn}
                onClick={() => { void pasteIntoField((value) => setDescription(value)); }}
                title="Incolla descrizione"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_paste</span>
              </button>
              <button
                type="button"
                className={styles.fieldActionBtn}
                onClick={() => { void copyFieldValue(description, 'Descrizione copiata'); }}
                title="Copia descrizione"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
              </button>
            </span>
          </label>

          <textarea
            className={`form-control ${styles.descriptionInput}`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={9}
            placeholder="Dettagli, checklist, appunti operativi..."
          />
        </div>

        <div className={styles.inlineSelectors}>
          <OptionSelector
            label="Stato"
            options={STATUS_OPTIONS}
            value={status}
            compact
            columnsClassName={styles.optionGrid4}
            onChange={setStatus}
          />

          <OptionSelector
            label="Urgenza"
            options={URGENCY_OPTIONS}
            value={urgency}
            compact
            columnsClassName={styles.optionGrid4}
            onChange={setUrgency}
          />
        </div>

        <div
          className={`${styles.dropzoneShell} ${dropzoneActive ? styles.dropzoneShellActive : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDropzoneActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDropzoneActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
            setDropzoneActive(false);
          }}
          onDrop={(event) => { void handleDropFiles(event); }}
        >
          <div className={styles.dropzoneHeader}>
            <div className={styles.dropzoneIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {dropzoneActive ? 'file_download_done' : 'upload_file'}
              </span>
            </div>
            <div>
              <div className={styles.dropzoneTitle}>Allega file alla task</div>
              <div className={styles.dropzoneText}>
                Trascina qui immagini, PDF o file generici, oppure usa il pulsante qui sotto.
              </div>
            </div>
          </div>

          <AttachmentPanel
            attachments={combinedAttachments}
            title="Allegati task"
            hint="Le immagini restano in preview, i PDF si aprono in una nuova tab."
            onAddFiles={handleAddFiles}
            onRemove={handleRemoveAttachment}
          />
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
