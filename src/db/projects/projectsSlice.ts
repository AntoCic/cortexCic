import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Project } from './Project';

interface ProjectsState {
  items: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  items: [],
  currentProject: null,
  loading: true,
  error: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<Project[]>) {
      state.items = action.payload;
      state.loading = false;
    },
    setCurrentProject(state, action: PayloadAction<Project | null>) {
      state.currentProject = action.payload;
    },
    addProject(state, action: PayloadAction<Project>) {
      state.items.push(action.payload);
    },
    updateProject(state, action: PayloadAction<Project>) {
      const idx = state.items.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
      if (state.currentProject?.id === action.payload.id) state.currentProject = action.payload;
    },
    removeProject(state, action: PayloadAction<string>) {
      state.items = state.items.filter((p) => p.id !== action.payload);
      if (state.currentProject?.id === action.payload) state.currentProject = null;
    },
    setProjectsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setProjectsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setProjects,
  setCurrentProject,
  addProject,
  updateProject,
  removeProject,
  setProjectsLoading,
  setProjectsError,
} = projectsSlice.actions;

export default projectsSlice.reducer;
