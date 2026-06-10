import { useTenantStore } from '../../store/tenant.store.js';
import { ShieldIcon } from './Icons.jsx';

export default function BotToggle({ compact = false }) {
  const { tenant, toggleBot } = useTenantStore();

  if (!tenant) return null;

  const isOn = tenant.businessOpen;

  if (compact) {
    return (
      <button
        onClick={toggleBot}
        className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
          isOn
            ? 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15'
            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
        role="switch"
        aria-checked={isOn}
        title={isOn ? 'Bot activo' : 'Bot pausado'}
      >
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            isOn
              ? 'bg-white text-emerald-700 dark:bg-slate-950 dark:text-emerald-300'
              : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <ShieldIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Bot de WhatsApp</p>
          <p className="text-xs opacity-80 dark:opacity-70">{isOn ? 'Activo' : 'Pausado'}</p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ${isOn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'} dark:bg-slate-800 dark:text-slate-300`}>
          <ShieldIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bot de WhatsApp</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isOn ? 'Responde automáticamente dentro del horario configurado.' : 'Pausado manualmente; no responderá nuevos mensajes.'}
          </p>
        </div>
        <button
          onClick={toggleBot}
          className={`relative inline-flex h-8 w-14 items-center rounded-full p-1 transition ${
            isOn ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          role="switch"
          aria-checked={isOn}
          title={isOn ? 'Bot activo' : 'Bot pausado'}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
              isOn ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Estado actual</span>
        <span className={`font-semibold ${isOn ? 'text-emerald-700' : 'text-slate-500'} dark:text-slate-200`}>
          {isOn ? 'Activo' : 'Pausado'}
        </span>
      </div>
    </div>
  );
}
