import { useEffect, useState, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setNotes,
  appendNotes,
  addNote,
  updateNote,
  removeNote,
  setLoading,
  setLoadingMore,
  setError,
  resetNotes,
} from '../../db/notes/notesSlice';
import { deleteStoredAttachments, uploadAttachments } from '../../db/attachments/attachmentStorage';
import { getNotes, getNoteById, createNote, updateNote as repoUpdateNote, deleteNote } from '../../db/notes/noteRepo';
import { useAuth } from '../../db/auth/useAuth';
import { Btn } from '../../components/Btn/Btn';
import { toast } from '../../components/toast/toast';
import { NoteType, NoteTypeLabel, NoteTypeColor } from '../../enums/NoteType';
import type { NoteTypeValue } from '../../enums/NoteType';
import type { Note } from '../../db/notes/Note';
import type { Attachment } from '../../db/attachments/Attachment';
import { noteContentToPlainText } from '../../db/notes/noteContent';
import { staggerContainer, fadeUp } from '../../styles/motionVariants';
import NoteCard from './cmp/NoteCard';
import NoteModal from './cmp/NoteModal';
import styles from './Notes.module.css';

const Notes = () => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { noteId } = useParams<{ noteId?: string }>();
  const { items, hasMore, loading, loadingMore } = useAppSelector((s) => s.notes);
  const shouldReduceMotion = useReducedMotion();

  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [routeNote, setRouteNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<NoteTypeValue | ''>('');

  useEffect(() => {
    if (!user) return;
    dispatch(resetNotes());
    dispatch(setLoading(true));
    getNotes(user.uid)
      .then((res) => dispatch(setNotes(res)))
      .catch((err) => dispatch(setError(err.message)));
  }, [user, dispatch]);

  useEffect(() => {
    if (!noteId) {
      return;
    }

    const existingNote = items.find((item) => item.id === noteId);
    if (existingNote) return;

    if (!user) return;

    let cancelled = false;

    getNoteById(user.uid, noteId)
      .then((note) => {
        if (cancelled) return;

        if (!note) {
          navigate('/notes', { replace: true });
          return;
        }

        setRouteNote(note);
        dispatch(addNote(note));
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('[Notes] failed to load note from route', { error, noteId });
        navigate('/notes', { replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, items, navigate, noteId, user]);

  const handleLoadMore = async () => {
    if (!user || !items.length) return;
    dispatch(setLoadingMore(true));
    try {
      const last = items[items.length - 1];
      const res = await getNotes(user.uid, last.updatedAt);
      dispatch(appendNotes(res));
    } catch {
      dispatch(setLoadingMore(false));
      toast.error('Errore nel caricamento');
    }
  };

  const handleCreate = async (data: {
    title?: string;
    content: string;
    type?: NoteTypeValue;
    tags?: string[];
    link?: string;
    attachments?: Attachment[];
  }) => {
    if (!user) throw new Error('Utente non autenticato');
    const note = await createNote(user.uid, data);
    dispatch(addNote(note));
    return note;
  };

  const handleUpdate = async (noteId: string, data: {
    title?: string;
    content: string;
    type?: NoteTypeValue;
    tags?: string[];
    link?: string;
    attachments?: Attachment[];
  }) => {
    if (!user) throw new Error('Utente non autenticato');
    await repoUpdateNote(user.uid, noteId, data);
    dispatch(updateNote({ id: noteId, ...data, updatedAt: Timestamp.now() }));
  };

  const deleteNoteRecord = async (note: Note, showSuccessToast = false) => {
    if (!user) throw new Error('Utente non autenticato');

    if (note.attachments?.length) {
      await deleteStoredAttachments(note.attachments);
    }

    await deleteNote(user.uid, note.id);
    dispatch(removeNote(note.id));
    setRouteNote((prev) => (prev?.id === note.id ? null : prev));

    if (noteId === note.id) {
      navigate('/notes', { replace: true });
    }

    if (showSuccessToast) {
      toast.success('Nota eliminata');
    }
  };

  const handleEdit = (note: Note) => {
    navigate(`/notes/${note.id}`);
  };

  const handleDelete = async (note: Note) => {
    if (!confirm(`Eliminare "${note.title ?? 'questa nota'}"?`)) return;
    try {
      await deleteNoteRecord(note, true);
    } catch {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleUploadAttachments = async (noteId: string, files: File[]) => {
    if (!user) throw new Error('Utente non autenticato');
    return uploadAttachments(`user/${user.uid}/notes/${noteId}`, files);
  };

  const handleModalClose = () => {
    setIsCreatingNote(false);
    setRouteNote(null);

    if (noteId) {
      navigate('/notes');
    }
  };

  const handleCreateNote = () => {
    setIsCreatingNote(true);
  };

  const handlePersistedNote = (note: Note) => {
    setIsCreatingNote(false);
    setRouteNote(note);

    if (noteId !== note.id) {
      navigate(`/notes/${note.id}`);
    }
  };

  const activeRouteNote = noteId
    ? (items.find((item) => item.id === noteId) ?? (routeNote?.id === noteId ? routeNote : null))
    : null;
  const showModal = isCreatingNote || Boolean(noteId && activeRouteNote);
  const modalInitial = isCreatingNote ? null : activeRouteNote;

  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((n) => {
      if (typeFilter && n.type !== typeFilter) return false;
      if (!q) return true;
      if (n.title?.toLowerCase().includes(q)) return true;
      if (n.tags?.some((t) => t.toLowerCase().includes(q))) return true;
      if (noteContentToPlainText(n.content).toLowerCase().includes(q)) return true;
      return false;
    });
  }, [items, search, typeFilter]);

  const motionProps = shouldReduceMotion
    ? {}
    : { variants: staggerContainer, initial: 'hidden', animate: 'visible' };

  const showSearchHint = (search || typeFilter) && hasMore;

  return (
    <div className={styles.root}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Le mie note</h1>
          <Btn
            color="primary"
            onClick={handleCreateNote}
          >
            <span className="material-symbols-outlined me-2" style={{ fontSize: 18, verticalAlign: 'text-bottom' }}>add</span>
            Nuova nota
          </Btn>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Cerca per titolo, contenuto o tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')} title="Cancella ricerca">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            )}
          </div>

          <div className={styles.typeFilters}>
            <button
              className={`${styles.typeFilter} ${typeFilter === '' ? styles.typeFilterActive : ''}`}
              onClick={() => setTypeFilter('')}
            >
              Tutti
            </button>
            {Object.values(NoteType).map((t) => (
              <button
                key={t}
                className={`${styles.typeFilter} ${typeFilter === t ? styles.typeFilterActive : ''}`}
                style={typeFilter === t ? { background: NoteTypeColor[t] + '1a', color: NoteTypeColor[t], borderColor: NoteTypeColor[t] } : {}}
                onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
              >
                {NoteTypeLabel[t]}
              </button>
            ))}
          </div>
        </div>

        {showSearchHint && (
          <p className={styles.searchHint}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 4 }}>info</span>
            Stai cercando nelle note caricate. Carica altre note per allargare la ricerca.
          </p>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" {...(!shouldReduceMotion ? { variants: fadeUp, initial: 'hidden', animate: 'visible' } : {})} className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" />
            </motion.div>
          ) : filteredNotes.length === 0 ? (
            <motion.div key="empty" {...(!shouldReduceMotion ? { variants: fadeUp, initial: 'hidden', animate: 'visible' } : {})} className={styles.empty}>
              <div className={styles.emptyIcon}>
                <span className="material-symbols-outlined">note_stack</span>
              </div>
              <div className={styles.emptyTitle}>
                {search || typeFilter ? 'Nessun risultato trovato' : 'Nessuna nota ancora'}
              </div>
              <div className={styles.emptyText}>
                {search || typeFilter
                  ? 'Prova a modificare i filtri di ricerca.'
                  : 'Crea la tua prima nota per iniziare.'}
              </div>
              {!search && !typeFilter && (
                <Btn color="primary" onClick={handleCreateNote}>
                  Crea nota
                </Btn>
              )}
            </motion.div>
          ) : (
            <motion.div key="grid" className={styles.grid} {...motionProps}>
              {filteredNotes.map((note) => (
                <motion.div key={note.id} {...(!shouldReduceMotion ? { variants: fadeUp } : {})}>
                  <NoteCard note={note} onEdit={handleEdit} onDelete={handleDelete} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && hasMore && !search && !typeFilter && (
          <div className={styles.loadMoreWrap}>
            <Btn version="outline" color="secondary" onClick={handleLoadMore} loading={loadingMore}>
              Carica altre
            </Btn>
          </div>
        )}
      </div>

      <NoteModal
        show={showModal}
        onClose={handleModalClose}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={deleteNoteRecord}
        onUploadAttachments={handleUploadAttachments}
        onPersistedNote={handlePersistedNote}
        initial={modalInitial}
      />
    </div>
  );
};

export default Notes;
