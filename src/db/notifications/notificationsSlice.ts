import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from './Notification';

interface NotificationsState {
  items: Notification[];
  hasMore: boolean;
  loadingMore: boolean;
}

const initialState: NotificationsState = {
  items: [],
  hasMore: true,
  loadingMore: false,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setLatest(state, action: PayloadAction<Notification[]>) {
      const older = state.items.filter(
        (existing) => !action.payload.find((n) => n.id === existing.id),
      );
      state.items = [...action.payload, ...older];
      state.hasMore = action.payload.length >= 30;
    },
    prependOlder(
      state,
      action: PayloadAction<{ items: Notification[]; hasMore: boolean }>,
    ) {
      const newIds = new Set(action.payload.items.map((n) => n.id));
      const deduped = state.items.filter((n) => !newIds.has(n.id));
      state.items = [...action.payload.items, ...deduped];
      state.hasMore = action.payload.hasMore;
      state.loadingMore = false;
    },
    setLoadingMore(state, action: PayloadAction<boolean>) {
      state.loadingMore = action.payload;
    },
    updateNotification(state, action: PayloadAction<Partial<Notification> & { id: string }>) {
      const idx = state.items.findIndex((n) => n.id === action.payload.id);
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
    },
    resetNotifications() {
      return initialState;
    },
  },
});

export const { setLatest, prependOlder, setLoadingMore, updateNotification, resetNotifications } =
  notificationsSlice.actions;

export default notificationsSlice.reducer;
