// store/auth.store.js
// Access token stored in memory only — never localStorage (XSS protection).

import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,

  setAuth: (token, user) => set({ accessToken: token, user }),
  setAccessToken: (token) => set({ accessToken: token }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));
