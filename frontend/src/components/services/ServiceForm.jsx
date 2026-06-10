import { useEffect, useState } from 'react';
import { SparkIcon } from '../common/Icons.jsx';

export default function ServiceForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    durationMin: 30,
    price: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name ?? '',
        description: initial.description ?? '',
        durationMin: initial.durationMin ?? 30,
        price: initial.price ?? '',
      });
    }
  }, [initial]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        durationMin: parseInt(form.durationMin, 10),
        price: parseFloat(form.price),
      });
    } catch (err) {
      setError(err.response?.data?.error ?? 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300">
          <SparkIcon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-950 dark:text-slate-50">
            {initial ? 'Editar servicio' : 'Nuevo servicio'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Define duración, precio y una descripción clara para el bot.</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Nombre del servicio
          </label>
          <input
            required
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="Corte de cabello"
            className="app-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Duración en minutos
          </label>
          <input
            required
            type="number"
            min="5"
            max="480"
            value={form.durationMin}
            onChange={set('durationMin')}
            className="app-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Precio MXN
          </label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={set('price')}
            placeholder="150.00"
            className="app-input"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Descripción opcional
          </label>
          <input
            type="text"
            value={form.description}
            onChange={set('description')}
            placeholder="Breve descripción para el bot"
            className="app-input"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="app-button-secondary">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="app-button-primary disabled:opacity-50"
        >
          {loading ? 'Guardando...' : initial ? 'Guardar cambios' : 'Agregar servicio'}
        </button>
      </div>
    </form>
  );
}
