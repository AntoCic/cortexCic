import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
import { getNotes, createNote, updateNote as repoUpdateNote, deleteNote } from '../../db/notes/noteRepo';
import { useAuth } from '../../db/auth/useAuth';
import { Btn } from '../../components/Btn/Btn';
import { toast } from '../../components/toast/toast';
import { NoteType, NoteTypeLabel, NoteTypeColor } from '../../enums/NoteType';
import type { NoteTypeValue } from '../../enums/NoteType';
import type { Note } from '../../db/notes/Note';
import { staggerContainer, fadeUp } from '../../styles/motionVariants';
import NoteCard from './cmp/NoteCard';
import NoteModal from './cmp/NoteModal';
import styles from './Notes.module.css';

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent ?? div.innerText ?? '';
}

const Notes = () => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { items, hasMore, loading, loadingMore } = useAppSelector((s) => s.notes);
  const shouldReduceMotion = useReducedMotion();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Note | null>(null);
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

  const handleLoadMore = async () => {
    if (!user || !items.length) return;
    dispatch(setLoadingMore(true));
    try {
      const last = items[items.length - 1];
      const res = await getNotes(user.uid, last.updatedAt);
      dispatch(appendNotes(res));
    } catch (err) {
      dispatch(setLoadingMore(false));
      toast.error('Errore nel caricamento');
    }
  };

  const handleSave = async (data: {
    title: string;
    content: string;
    type?: NoteTypeValue;
    tags?: string[];
  }) => {
    if (!user) return;
    if (editTarget) {
      await repoUpdateNote(user.uid, editTarget.id, data);
      dispatch(updateNote({ id: editTarget.id, ...data }));
      toast.success('Nota aggiornata');
    } else {
      const note = await createNote(user.uid, data);
      dispatch(addNote(note));
      toast.success('Nota creata');
    }
    setEditTarget(null);
  };

  const handleEdit = (note: Note) => {
    setEditTarget(note);
    setShowModal(true);
  };

  const handleDelete = async (note: Note) => {
    if (!user) return;
    if (!confirm(`Eliminare "${note.title}"?`)) return;
    try {
      await deleteNote(user.uid, note.id);
      dispatch(removeNote(note.id));
      toast.success('Nota eliminata');
    } catch {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditTarget(null);
  };

  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((n) => {
      if (typeFilter && n.type !== typeFilter) return false;
      if (!q) return true;
      if (n.title.toLowerCase().includes(q)) return true;
      if (n.tags?.some((t) => t.toLowerCase().includes(q))) return true;
      if (stripHtml(n.content).toLowerCase().includes(q)) return true;
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
            onClick={() => { setEditTarget(null); setShowModal(true); }}
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
                <Btn color="primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>
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
        onSave={handleSave}
        initial={editTarget}
      />
    </div>
  );
};

export default Notes;
