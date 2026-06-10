import { XIcon } from './Icons.jsx';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  danger = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45"
        onClick={onCancel}
        aria-label="Cerrar diálogo"
      />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Confirmación</p>
            <h3 className="mt-2 text-xl font-bold text-slate-950">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={onCancel} className="app-button-secondary">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`app-button ${danger ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
