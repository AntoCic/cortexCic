import type { CSSProperties, DragEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { ProjectMember } from '../../../../db/projects/Project';
import { formatTaskTitle } from '../../../../db/tasks/taskTitle';
import { timestampToDateInputValue } from '../../../../db/tasks/taskDueDate';
import { useAuth } from '../../../../db/auth/useAuth';
import type { TaskComment } from '../../../../db/tasks/taskCommentRepo';
import { listTaskComments, addTaskComment, deleteTaskComment } from '../../../../db/tasks/taskCommentRepo';
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
  assigneeUid: string;
  dueDate: string;
  keptAttachments: Attachment[];
  removedAttachments: Attachment[];
  newFiles: File[];
}

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (data: TaskModalValue) => Promise<{ attachments: Attachment[] } | void>;
  initial?: Task | null;
  projectIdentifier?: string;
  nextSerialNumber?: number;
  showOnboardingHint?: boolean;
  members?: Record<string, ProjectMember>;
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

function formatCommentDate(ts: TaskComment['createdAt']): string {
  if (!ts) return '';
  return ts.toDate().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function valueSignature(value: TaskModalValue): string {
  return JSON.stringify({
    title: value.title,
    description: value.description,
    status: value.status,
    urgency: value.urgency,
    category: value.category,
    assigneeUid: value.assigneeUid,
    dueDate: value.dueDate,
    kept: value.keptAttachments.map((a) => a.id),
    removed: value.removedAttachments.map((a) => a.id),
    files: value.newFiles.map((f) => `${f.name}:${f.size}`),
  });
}

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

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
}: SelectorProps<T>) => {
  const activeOption = options.find((option) => option.value === value);

  return (
  <div className={styles.section}>
    <p className={styles.sectionLabel}>
      {label}
      {activeOption && (
        <span
          className={styles.sectionValueBadge}
          style={{ '--option-color': activeOption.color } as CSSProperties}
        >
          {activeOption.label}
        </span>
      )}
    </p>
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
            aria-label={option.label}
            title={option.label}
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
};

const TaskModal = ({
  show,
  onClose,
  onSave,
  initial,
  projectIdentifier,
  nextSerialNumber = 1,
  showOnboardingHint = false,
  members = {},
}: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatusValue>(TaskStatus.Todo);
  const [urgency, setUrgency] = useState<TaskUrgencyValue>(TaskUrgency.Medium);
  const [category, setCategory] = useState<TaskCategoryValue>(TaskCategory.Feature);
  const [assigneeUid, setAssigneeUid] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [removedAttachments, setRemovedAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [titleError, setTitleError] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const { user, userProfile } = useAuth();
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);
  const lastSavedSigRef = useRef('');
  const savingRef = useRef(false);
  const rerunRef = useRef(false);
  const valueRef = useRef<TaskModalValue | null>(null);

  const isEditing = !!initial;

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
    setAssigneeUid(initial?.assigneeUid ?? '');
    setDueDate(timestampToDateInputValue(initial?.dueDate));
    setAttachments(initial?.attachments ?? []);
    setDropzoneActive(false);
    setSaveState('idle');
    setTitleError(false);
    setComments([]);
    setCommentText('');
    savingRef.current = false;
    rerunRef.current = false;
    lastSavedSigRef.current = valueSignature({
      title: (initial?.customTitle ?? initial?.title ?? '').trim(),
      description: (initial?.description ?? '').trim(),
      status: initial?.status ?? TaskStatus.Todo,
      urgency: initial?.urgency ?? TaskUrgency.Medium,
      category: initial?.category ?? TaskCategory.Feature,
      assigneeUid: initial?.assigneeUid ?? '',
      dueDate: timestampToDateInputValue(initial?.dueDate),
      keptAttachments: initial?.attachments ?? [],
      removedAttachments: [],
      newFiles: [],
    });
  }, [show, initial]);

  useEffect(() => {
    if (!show || !initial) return;
    listTaskComments(initial.projectId, initial.id)
      .then(setComments)
      .catch(() => toast.error('Impossibile caricare i commenti'));
  }, [show, initial]);

  useEffect(() => () => revokePendingAttachments(pendingAttachmentsRef.current), []);

  const combinedAttachments = useMemo<Attachment[]>(
    () => [...attachments, ...pendingAttachments],
    [attachments, pendingAttachments],
  );

  const currentValue = useMemo<TaskModalValue>(() => ({
    title: title.trim(),
    description: description.trim(),
    status,
    urgency,
    category,
    assigneeUid,
    dueDate,
    keptAttachments: attachments,
    removedAttachments,
    newFiles: pendingAttachments.map((item) => item.file),
  }), [title, description, status, urgency, category, assigneeUid, dueDate, attachments, removedAttachments, pendingAttachments]);

  useEffect(() => {
    valueRef.current = currentValue;
  }, [currentValue]);

  useEffect(() => {
    if (title.trim()) setTitleError(false);
  }, [title]);

  const runAutosave = useCallback(async () => {
    const value = valueRef.current;
    if (!value || !value.title) return;

    if (savingRef.current) {
      rerunRef.current = true;
      return;
    }

    const signature = valueSignature(value);
    if (signature === lastSavedSigRef.current) return;

    savingRef.current = true;
    setSaveState('saving');
    try {
      const result = await onSave(value);
      if (result?.attachments) {
        revokePendingAttachments(pendingAttachmentsRef.current);
        setPendingAttachments([]);
        setRemovedAttachments([]);
        setAttachments(result.attachments);
        lastSavedSigRef.current = valueSignature({
          ...value,
          keptAttachments: result.attachments,
          removedAttachments: [],
          newFiles: [],
        });
      } else {
        lastSavedSigRef.current = signature;
      }
      setSaveState('saved');
    } catch (error) {
      console.error('[TaskModal] autosave failed', { error, taskId: initial?.id ?? null });
      setSaveState('error');
      toast.error('Salvataggio task non riuscito');
    } finally {
      savingRef.current = false;
      if (rerunRef.current) {
        rerunRef.current = false;
        void runAutosave();
      }
    }
  }, [initial, onSave]);

  // Autosave on edit: debounce field changes (creation keeps the explicit Salva button).
  useEffect(() => {
    if (!show || !isEditing) return;
    if (!currentValue.title) {
      setTitleError(true);
      return;
    }
    if (valueSignature(currentValue) === lastSavedSigRef.current) return;

    setSaveState((prev) => (prev === 'saving' ? prev : 'dirty'));
    const timer = window.setTimeout(() => { void runAutosave(); }, 600);
    return () => window.clearTimeout(timer);
  }, [show, isEditing, currentValue, runAutosave]);

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

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text || !initial || !user) return;

    const authorName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : (user.displayName || user.email || 'Utente');

    setSendingComment(true);
    try {
      await addTaskComment(initial.projectId, initial.id, { text, authorUid: user.uid, authorName });
      setCommentText('');
      const refreshed = await listTaskComments(initial.projectId, initial.id);
      setComments(refreshed);
    } catch {
      toast.error('Invio commento non riuscito');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (comment: TaskComment) => {
    if (!initial) return;
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    try {
      await deleteTaskComment(initial.projectId, initial.id, comment.id);
    } catch {
      toast.error('Eliminazione commento non riuscita');
      const refreshed = await listTaskComments(initial.projectId, initial.id);
      setComments(refreshed);
    }
  };

  const performSave = async () => {
    if (!title.trim()) {
      setTitleError(true);
      toast.error('Il titolo è obbligatorio');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
        urgency,
        category,
        assigneeUid,
        dueDate,
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

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    await performSave();
  };

  const handleRequestClose = () => {
    if (isEditing) {
      void (async () => {
        await runAutosave();
        revokePendingAttachments(pendingAttachmentsRef.current);
        onClose();
      })();
      return;
    }
    revokePendingAttachments(pendingAttachmentsRef.current);
    onClose();
  };

  const saveStatusLabel = titleError ? 'Il titolo è obbligatorio'
    : saveState === 'saving' ? 'Salvataggio automatico…'
    : saveState === 'saved' ? 'Tutto salvato'
    : saveState === 'error' ? 'Errore di salvataggio'
    : saveState === 'dirty' ? 'Modifiche in attesa…'
    : 'Autosave attivo';

  const saveStatusIcon = titleError || saveState === 'error' ? 'error' : saveState === 'saved' ? 'check_circle' : 'sync';

  const memberOptions = Object.entries(members)
    .filter((entry): entry is [string, ProjectMember] => !!entry[1])
    .sort(([, a], [, b]) => a.email.localeCompare(b.email));

  return (
    <Modal
      show={show}
      onClose={handleRequestClose}
      title={initial ? 'Modifica task' : 'Nuova task'}
      size="xl"
      centered
      scrollable
      headerActions={(
        <button
          type="button"
          className={styles.headerSaveBtn}
          onClick={() => { void performSave(); }}
          disabled={loading}
          aria-label="Salva task"
          title="Salva task"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
        </button>
      )}
      footer={(
        <div className="d-flex w-100 align-items-center justify-content-between gap-3">
          {isEditing ? (
            <span
              className="d-inline-flex align-items-center gap-1 small"
              style={{ color: titleError || saveState === 'error' ? '#e03131' : '#6c757d' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{saveStatusIcon}</span>
              {saveStatusLabel}
            </span>
          ) : <span />}
          <div className="d-flex gap-2">
            <Btn version="outline" color="secondary" onClick={handleRequestClose} disabled={loading}>
              {isEditing ? 'Chiudi' : 'Annulla'}
            </Btn>
            <Btn color="primary" onClick={handleSave as never} loading={loading}>
              <span className="d-inline-flex align-items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                Salva
              </span>
            </Btn>
          </div>
        </div>
      )}
    >
      <form
        onSubmit={isEditing ? (event) => { event.preventDefault(); void runAutosave(); } : handleSave}
        className={`${styles.shell} ${showOnboardingHint ? styles.shellWithHero : ''}`}
      >
        {showOnboardingHint && (
          <div className={`${styles.hero} ${styles.areaHero}`}>
            <h3 className={styles.heroTitle}>Imposta contesto e priorità della task</h3>
            <p className={styles.heroText}>
              Stato, urgenza e categoria restano sempre visibili qui sotto, così scegli al volo senza menu nascosti.
            </p>
          </div>
        )}

        <div className={styles.areaCategory}>
          <OptionSelector
            label="Categoria"
            options={CATEGORY_OPTIONS}
            value={category}
            columnsClassName={styles.optionGrid3}
            onChange={setCategory}
          />
        </div>

        <div className={`${styles.fieldGroup} ${styles.areaAssignee}`}>
          <label className={styles.fieldHeader}>
            <span className={styles.fieldLabel}>Assegnato a</span>
          </label>
          <select
            className="form-select"
            value={assigneeUid}
            onChange={(event) => setAssigneeUid(event.target.value)}
          >
            <option value="">Nessuno</option>
            {memberOptions.map(([uid, member]) => (
              <option key={uid} value={uid}>{member.email}</option>
            ))}
          </select>
        </div>

        <div className={styles.areaRestMain}>
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

          <div className={`${styles.titleComposer} ${titleError ? styles.titleComposerError : ''}`}>
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

          {titleError && (
            <div className={styles.titleErrorText}>Il titolo è obbligatorio</div>
          )}

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
          <AttachmentPanel
            attachments={combinedAttachments}
            title="Allegati task"
            hint="Trascina qui i file oppure usa il pulsante"
            onAddFiles={handleAddFiles}
            onRemove={handleRemoveAttachment}
          />
        </div>

        {isEditing && (
          <div className={`${styles.section} ${styles.commentsSection}`}>
            <p className={styles.sectionLabel}>Commenti</p>

            <div className={styles.commentList}>
              {comments.length === 0 && (
                <p className={styles.commentEmpty}>Nessun commento, sii il primo a scrivere.</p>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentMeta}>
                    <span className={styles.commentAuthor}>{comment.authorName}</span>
                    <span className={styles.commentDate}>{formatCommentDate(comment.createdAt)}</span>
                    {user?.uid === comment.authorUid && (
                      <button
                        type="button"
                        className={styles.commentDeleteBtn}
                        onClick={() => { void handleDeleteComment(comment); }}
                        title="Elimina commento"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    )}
                  </div>
                  <p className={styles.commentText}>{comment.text}</p>
                </div>
              ))}
            </div>

            <div className={styles.commentComposer}>
              <input
                type="text"
                className={`form-control ${styles.commentInput}`}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Scrivi un commento..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSendComment();
                  }
                }}
              />
              <Btn
                type="button"
                color="primary"
                onClick={() => { void handleSendComment(); }}
                loading={sendingComment}
                disabled={!commentText.trim()}
              >
                Invia
              </Btn>
            </div>
          </div>
        )}
        </div>

        <div className={styles.areaRestSide}>
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

          <div className={styles.fieldGroup}>
            <label className={styles.fieldHeader}>
              <span className={styles.fieldLabel}>
                Scadenza <span className={styles.fieldOptional}>(opzionale)</span>
              </span>
            </label>
            <div className="d-flex align-items-center gap-2">
              <input
                type="date"
                className="form-control"
                style={{ maxWidth: 200 }}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
              {dueDate && (
                <button
                  type="button"
                  className={styles.fieldActionBtn}
                  onClick={() => setDueDate('')}
                  title="Rimuovi scadenza"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
