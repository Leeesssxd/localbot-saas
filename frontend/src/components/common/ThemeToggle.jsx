import { useThemeStore } from '../../store/theme.store.js';
import { MoonIcon, SunIcon } from './Icons.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-pressed={dark}
      title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {dark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      <span className="hidden sm:inline">{dark ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
