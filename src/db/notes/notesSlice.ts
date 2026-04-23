import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Note } from './Note';

interface NotesState {
  items: Note[];
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

const initialState: NotesState = {
  items: [],
  hasMore: true,
  loading: false,
  loadingMore: false,
  error: null,
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setNotes(state, action: PayloadAction<{ items: Note[]; hasMore: boolean }>) {
      state.items = action.payload.items;
      state.hasMore = action.payload.hasMore;
      state.loading = false;
    },
    appendNotes(state, action: PayloadAction<{ items: Note[]; hasMore: boolean }>) {
      const newIds = new Set(action.payload.items.map((n) => n.id));
      const deduped = state.items.filter((n) => !newIds.has(n.id));
      state.items = [...deduped, ...action.payload.items];
      state.hasMore = action.payload.hasMore;
      state.loadingMore = false;
    },
    addNote(state, action: PayloadAction<Note>) {
      state.items = [action.payload, ...state.items];
    },
    updateNote(state, action: PayloadAction<Partial<Note> & { id: string }>) {
      const idx = state.items.findIndex((n) => n.id === action.payload.id);
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
    },
    removeNote(state, action: PayloadAction<string>) {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setLoadingMore(state, action: PayloadAction<boolean>) {
      state.loadingMore = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    resetNotes() {
      return initialState;
    },
  },
});

export const {
  setNotes,
  appendNotes,
  addNote,
  updateNote,
  removeNote,
  setLoading,
  setLoadingMore,
  setError,
  resetNotes,
} = notesSlice.actions;

export default notesSlice.reducer;
