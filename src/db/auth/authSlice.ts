import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../users/User';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  userProfile: null,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ user: User; userProfile: UserProfile | null }>) {
      state.user = action.payload.user;
      state.userProfile = action.payload.userProfile;
      state.loading = false;
    },
    clearUser(state) {
      state.user = null;
      state.userProfile = null;
      state.loading = false;
    },
    setUserProfile(state, action: PayloadAction<UserProfile | null>) {
      state.userProfile = action.payload;
    },
  },
});

export const { setUser, clearUser, setUserProfile } = authSlice.actions;
export default authSlice.reducer;
