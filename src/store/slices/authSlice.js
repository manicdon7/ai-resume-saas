import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  isPro: false,
  credits: 0,
  loading: true
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      // Only store serializable user data
      const user = action.payload;
      if (user) {
        state.user = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        };
        state.isAuthenticated = true;
      } else {
        state.user = null;
        state.isAuthenticated = false;
      }
      state.loading = false;
    },
    setProStatus: (state, action) => {
      state.isPro = action.payload;
    },
    setCredits: (state, action) => {
      state.credits = action.payload;
    },
    signOut: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isPro = false;
      state.credits = 0;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { setUser, setProStatus, setCredits, signOut, setLoading } = authSlice.actions;
export default authSlice.reducer;
