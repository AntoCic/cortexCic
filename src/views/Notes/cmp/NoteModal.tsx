import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import AttachmentPanel from '../../../components/AttachmentPanel/AttachmentPanel';
import { Btn } from '../../../components/Btn/Btn';
import { toast } from '../../../components/toast/toast';
import { deleteStoredAttachments } from '../../../db/attachments/attachmentStorage';
import type { Attachment } from '../../../db/attachments/Attachment';
import { isNoteContentEmpty, noteContentToPlainText } from '../../../db/notes/noteContent';
import { NoteType, NoteTypeColor, NoteTypeIcon, NoteTypeLabel } from '../../../enums/NoteType';
import type { NoteTypeValue } from '../../../enums/NoteType';
import type { Note } from '../../../db/notes/Note';
import NoteEditor from './NoteEditor';
import styles from './NoteModal.module.css';

const PRESET_TAGS = ['frontend', 'backend', 'lexhero', 'react', 'vue', 'docker'];

function linkOrigin(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

async function copyText(value: string, successMessage: string) {
  if (!value.trim()) return;

  try {
    await navigator.clipboard.writeText(value.trim());
    toast.success(successMessage);
  } catch {
    toast.error('Copia non riuscita');
  }
}

async function pasteText(onValue: (value: string) => void) {
  try {
    const clipboardText = await navigator.clipboard.readText();
    if (!clipboardText) return;
    onValue(clipboardText.trim());
  } catch {
    toast.error('Incolla non disponibile');
  }
}

interface Props {
  show: boolean;
  onClose: () => void;
  onCreate: (data: {
    title?: string;
    content: string;
    type?: NoteTypeValue;
    tags?: string[];
    link?: string;
    attachments?: Attachment[];
  }) => Promise<Note>;
  onUpdate: (noteId: string, data: {
    title?: string;
    content: string;
    type?: NoteTypeValue;
    tags?: string[];
    link?: string;
    attachments?: Attachment[];
  }) => Promise<void>;
  onDelete: (note: Note) => Promise<void>;
  onUploadAttachments: (noteId: string, files: File[]) => Promise<Attachment[]>;
  onPersistedNote?: (note: Note) => void;
  initial?: Note | null;
}

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface NoteDraft {
  title: string;
  content: string;
  type: NoteTypeValue | '';
  tags: string[];
  link: string;
  attachments: Attachment[];
}

function buildPayload(draft: NoteDraft) {
  const title = draft.title.trim();
  const link = draft.link.trim();

  return {
    title: title || undefined,
    content: draft.content,
    type: draft.type || undefined,
    tags: draft.tags.length ? draft.tags : undefined,
    link: link || undefined,
    attachments: draft.attachments.length ? draft.attachments : undefined,
  };
}

function hasMeaningfulNoteData(payload: ReturnType<typeof buildPayload>): boolean {
  return Boolean(
    payload.title
      || payload.type
      || payload.link
      || payload.tags?.length
      || payload.attachments?.length
      || noteContentToPlainText(payload.content),
  );
}

function payloadSignature(payload: ReturnType<typeof buildPayload>): string {
  return JSON.stringify({
    ...payload,
    tags: payload.tags ?? [],
    attachments: payload.attachments ?? [],
  });
}

const NoteModal = ({
  show,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onUploadAttachments,
  onPersistedNote,
  initial,
}: Props) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NoteTypeValue | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [closing, setClosing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const persistedNoteRef = useRef<Note | null>(initial ?? null);
  const createdInSessionRef = useRef(!initial);
  const lastSavedSignatureRef = useRef('');
  const removedAttachmentsRef = useRef<Attachment[]>([]);
  const isPersistingRef = useRef(false);
  const rerunPersistRef = useRef(false);
  const rerunForceRef = useRef(false);
  const activePersistPromiseRef = useRef<Promise<boolean> | null>(null);
  const previousShowRef = useRef(show);
  const previousInitialIdRef = useRef<string | null>(initial?.id ?? null);
  const currentDraftRef = useRef<NoteDraft>({
    title: '',
    content: '',
    type: '',
    tags: [],
    link: '',
    attachments: [],
  });

  useEffect(() => {
    const wasShowing = previousShowRef.current;
    previousShowRef.current = show;

    if (!show) return;

    const nextInitialId = initial?.id ?? null;
    const previousInitialId = previousInitialIdRef.current;
    const isPromotingNewDraftToPersistedNote = !previousInitialId
      && !!nextInitialId
      && persistedNoteRef.current?.id === nextInitialId;
    const noteIdentityChanged = previousInitialId !== nextInitialId;
    const shouldHydrateFromInitial = !wasShowing || (noteIdentityChanged && !isPromotingNewDraftToPersistedNote);

    previousInitialIdRef.current = nextInitialId;

    if (!shouldHydrateFromInitial) {
      persistedNoteRef.current = initial ?? persistedNoteRef.current;
      return;
    }

    setTitle(initial?.title ?? '');
    setContent(initial?.content ?? '');
    setType(initial?.type ?? '');
    setLink(initial?.link ?? '');
    setTags(initial?.tags ?? []);
    setAttachments(initial?.attachments ?? []);
    setEditOpen(false);
    setSaveState('idle');
    setClosing(false);
    setUploading(false);

    persistedNoteRef.current = initial ?? null;
    createdInSessionRef.current = !initial;
    removedAttachmentsRef.current = [];
    lastSavedSignatureRef.current = payloadSignature(buildPayload({
      title: initial?.title ?? '',
      content: initial?.content ?? '',
      type: initial?.type ?? '',
      tags: initial?.tags ?? [],
      link: initial?.link ?? '',
      attachments: initial?.attachments ?? [],
    }));
  }, [show, initial]);

  useEffect(() => {
    currentDraftRef.current = { title, content, type, tags, link, attachments };
  }, [title, content, type, tags, link, attachments]);

  const saveDraftOnce = useCallback(async (force = false): Promise<boolean> => {
    const draft = currentDraftRef.current;
    const payload = buildPayload(draft);
    const signature = payloadSignature(payload);
    const note = persistedNoteRef.current;
    const shouldSkipEmptyDraft = createdInSessionRef.current && !hasMeaningfulNoteData(payload);

    if (!note && !hasMeaningfulNoteData(payload)) {
      setSaveState('idle');
      return true;
    }

    if (!force && shouldSkipEmptyDraft) {
      setSaveState('idle');
      return true;
    }

    if (signature === lastSavedSignatureRef.current && !removedAttachmentsRef.current.length) {
      return true;
    }

    isPersistingRef.current = true;

    try {
      setSaveState('saving');

      if (note) {
        await onUpdate(note.id, payload);
      } else {
        const createdNote = await onCreate(payload);
        persistedNoteRef.current = createdNote;
        onPersistedNote?.(createdNote);
      }

      lastSavedSignatureRef.current = signature;

      if (removedAttachmentsRef.current.length) {
        const attachmentsToDelete = [...removedAttachmentsRef.current];
        removedAttachmentsRef.current = [];
        await deleteStoredAttachments(attachmentsToDelete);
      }

      setSaveState('saved');
      return true;
    } catch (error) {
      console.error('[NoteModal] autosave failed', {
        error,
        noteId: note?.id ?? null,
        payload,
        removedAttachments: removedAttachmentsRef.current,
      });
      setSaveState('error');
      toast.error('Salvataggio nota non riuscito');
      return false;
    } finally {
      isPersistingRef.current = false;
    }
  }, [onCreate, onPersistedNote, onUpdate]);

  const persistDraft = useCallback((force = false): Promise<boolean> => {
    if (activePersistPromiseRef.current) {
      rerunPersistRef.current = true;
      rerunForceRef.current = rerunForceRef.current || force;
      return activePersistPromiseRef.current;
    }

    const run = (async () => {
      let currentForce = force;
      let result = true;

      do {
        rerunPersistRef.current = false;
        rerunForceRef.current = false;
        result = await saveDraftOnce(currentForce);
        currentForce = rerunForceRef.current;
      } while (rerunPersistRef.current);

      return result;
    })();

    activePersistPromiseRef.current = run.finally(() => {
      activePersistPromiseRef.current = null;
    });

    return activePersistPromiseRef.current;
  }, [saveDraftOnce]);

  useEffect(() => {
    if (!show) return;

    setSaveState((prev) => (prev === 'saving' ? prev : 'dirty'));

    const timer = window.setTimeout(() => {
      void persistDraft();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [show, title, content, type, tags, link, attachments, persistDraft]);

  const ensurePersistedNote = async (): Promise<Note | null> => {
    if (persistedNoteRef.current) return persistedNoteRef.current;

    try {
      setSaveState('saving');
      const createdNote = await onCreate(buildPayload(currentDraftRef.current));
      persistedNoteRef.current = createdNote;
      lastSavedSignatureRef.current = payloadSignature(buildPayload(currentDraftRef.current));
      onPersistedNote?.(createdNote);
      setSaveState('saved');
      return createdNote;
    } catch (error) {
      console.error('[NoteModal] ensurePersistedNote failed', {
        error,
        payload: buildPayload(currentDraftRef.current),
      });
      setSaveState('error');
      toast.error('Non sono riuscito a preparare la nota per l’upload');
      return null;
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  const handleTypeClick = (value: NoteTypeValue) => {
    setType((prev) => (prev === value ? '' : value));
  };

  const requestClose = () => {
    void handleRequestClose();
  };

  const handleAddFiles = async (files: File[]) => {
    const note = await ensurePersistedNote();
    if (!note) return;

    setUploading(true);
    try {
      const uploaded = await onUploadAttachments(note.id, files);
      if (!uploaded.length) return;
      setAttachments((prev) => [...prev, ...uploaded]);
      setSaveState('dirty');
    } catch (error) {
      console.error('[NoteModal] attachment upload failed', {
        error,
        noteId: note.id,
        files: files.map((file) => ({ name: file.name, size: file.size, type: file.type })),
      });
      setSaveState('error');
      toast.error('Upload allegati non riuscito');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (attachment: Attachment) => {
    setAttachments((prev) => prev.filter((item) => item.id !== attachment.id));
    removedAttachmentsRef.current = [...removedAttachmentsRef.current, attachment];
    setSaveState('dirty');
  };

  const handleRequestClose = async () => {
    setClosing(true);

    const payload = buildPayload(currentDraftRef.current);
    const note = persistedNoteRef.current;

    try {
      if (!note && !hasMeaningfulNoteData(payload)) {
        onClose();
        return;
      }

      if (note && !hasMeaningfulNoteData(payload)) {
        await onDelete({
          ...note,
          title: payload.title,
          content: payload.content,
          type: payload.type,
          tags: payload.tags,
          link: payload.link,
          attachments: [...(payload.attachments ?? []), ...removedAttachmentsRef.current],
        });
        onClose();
        return;
      }

      const saveOk = await persistDraft(true);
      if (!saveOk) return;
      onClose();
    } catch (error) {
      console.error('[NoteModal] close request failed', {
        error,
        noteId: note?.id ?? null,
        payload,
      });
      setSaveState('error');
      toast.error('Non sono riuscito a chiudere la nota salvando tutto');
    } finally {
      setClosing(false);
    }
  };

  const saveStatusLabel = useMemo(() => {
    if (uploading) return 'Caricamento allegati…';
    if (closing) return 'Chiusura in corso…';
    if (saveState === 'saving') return 'Salvataggio automatico…';
    if (saveState === 'saved') return 'Tutto salvato';
    if (saveState === 'error') return 'Errore di salvataggio';
    if (saveState === 'dirty') return 'Modifiche in attesa…';
    return 'Autosave attivo';
  }, [closing, saveState, uploading]);

  const hasInfo = !!(title || type || link || tags.length || attachments.length);
  const isEditing = !!initial;
  const isLinkNote = type === NoteType.link;
  const contentEmpty = isNoteContentEmpty(content);
  const editorKey = `${initial?.id ?? 'new'}-${show ? 'open' : 'closed'}`;

  return (
    <Modal
      show={show}
      onClose={requestClose}
      title={isEditing ? 'Modifica nota' : 'Nuova nota'}
      fullscreen
      scrollable
      footer={(
        <div className="d-flex w-100 align-items-center justify-content-between gap-3">
          <span className={`${styles.saveState} ${saveState === 'error' ? styles.saveStateError : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {saveState === 'error' ? 'error' : saveState === 'saved' ? 'check_circle' : 'sync'}
            </span>
            {saveStatusLabel}
          </span>
          <Btn
            version="outline"
            color="secondary"
            onClick={requestClose}
            disabled={closing}
          >
            Chiudi
          </Btn>
        </div>
      )}
    >
      <div className={styles.infoBar}>
        <div className={styles.infoContent}>
          {title && <span className={styles.infoTitle}>{title}</span>}
          {type && (
            <span
              className={styles.infoBadge}
              style={{ background: `${NoteTypeColor[type]}1a`, color: NoteTypeColor[type] }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1 }}>
                {NoteTypeIcon[type]}
              </span>
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
          {attachments.length > 0 && (
            <span className={styles.infoBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: 12, lineHeight: 1 }}>attach_file</span>
              {attachments.length} allegati
            </span>
          )}
          {!hasInfo && (
            <span className={styles.infoEmpty}>
              {contentEmpty ? 'Nessun dettaglio aggiunto' : 'Solo contenuto testuale'}
            </span>
          )}
        </div>

        <button
          type="button"
          className={`${styles.editToggleBtn} ${editOpen ? styles.editToggleBtnActive : ''}`}
          onClick={() => setEditOpen((prev) => !prev)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>
            {editOpen ? 'keyboard_arrow_up' : 'tune'}
          </span>
          {editOpen ? 'Chiudi dettagli' : 'Apri dettagli'}
        </button>
      </div>

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
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Titolo della nota"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">
              Tipo <span className="text-muted fw-normal">(opzionale)</span>
            </label>
            <div className={styles.tagList}>
              {Object.values(NoteType).map((noteType) => (
                <button
                  key={noteType}
                  type="button"
                  className={`${styles.tagChip} ${type === noteType ? styles.tagChipActive : ''}`}
                  style={type === noteType ? { borderColor: NoteTypeColor[noteType], color: NoteTypeColor[noteType], background: `${NoteTypeColor[noteType]}1a` } : {}}
                  onClick={() => handleTypeClick(noteType)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    {type === noteType ? 'check' : NoteTypeIcon[noteType]}
                  </span>
                  {NoteTypeLabel[noteType]}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
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
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    {tags.includes(tag) ? 'check' : 'sell'}
                  </span>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {!isLinkNote && (
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Link <span className="text-muted fw-normal">(opzionale)</span>
              </label>
              <input
                type="url"
                className="form-control"
                value={link}
                onChange={(event) => setLink(event.target.value)}
                placeholder="https://…"
              />
            </div>
          )}

          <AttachmentPanel
            attachments={attachments}
            title="Allegati nota"
            hint="Immagini con preview, PDF in nuova tab, altri file scaricabili."
            uploading={uploading}
            onAddFiles={handleAddFiles}
            onRemove={handleRemoveAttachment}
          />
        </div>
      )}

      {isLinkNote && (
        <div className={styles.linkBar}>
          <div className={styles.linkBarHeader}>
            <span className={styles.linkBarTitle}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>link</span>
              Link nota
            </span>
            <div className={styles.linkBarActions}>
              <button
                type="button"
                className={styles.linkActionBtn}
                onClick={() => { void pasteText((value) => setLink(value)); }}
                title="Incolla link"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_paste</span>
              </button>
              <button
                type="button"
                className={styles.linkActionBtn}
                onClick={() => { void copyText(link, 'Link copiato'); }}
                title="Copia link"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
              </button>
            </div>
          </div>

          <input
            type="url"
            className="form-control"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://…"
          />
        </div>
      )}

      <NoteEditor
        key={editorKey}
        initialValue={content}
        onChange={(nextValue) => {
          setContent(nextValue);
          setSaveState((prev) => (prev === 'saving' ? prev : 'dirty'));
        }}
      />
    </Modal>
  );
};

export default NoteModal;
