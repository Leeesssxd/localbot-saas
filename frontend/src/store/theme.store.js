import { create } from 'zustand';

const storageKey = 'localbot-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem(storageKey);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
}

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    window.localStorage.setItem(storageKey, theme);
    set({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));

if (typeof window !== 'undefined') {
  const initial = getInitialTheme();
  document.documentElement.classList.toggle('dark', initial === 'dark');
}
