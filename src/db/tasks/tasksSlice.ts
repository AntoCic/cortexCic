import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Task } from './Task';
import type { TaskStatusValue } from '../../enums/TaskStatus';

interface TasksState {
  items: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  items: [],
  loading: true,
  error: null,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks(state, action: PayloadAction<Task[]>) {
      state.items = action.payload;
      state.loading = false;
    },
    addTask(state, action: PayloadAction<Task>) {
      state.items.push(action.payload);
    },
    updateTask(state, action: PayloadAction<Task>) {
      const idx = state.items.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    removeTask(state, action: PayloadAction<string>) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    moveTask(state, action: PayloadAction<{ taskId: string; newStatus: TaskStatusValue; newOrder: number }>) {
      const { taskId, newStatus, newOrder } = action.payload;
      const task = state.items.find((t) => t.id === taskId);
      if (task) {
        task.status = newStatus;
        task.order = newOrder;
      }
    },
    setTasksLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setTasksError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setTasks, addTask, updateTask, removeTask, moveTask, setTasksLoading, setTasksError } =
  tasksSlice.actions;

export default tasksSlice.reducer;
