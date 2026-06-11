import { useEffect, useState } from 'react';
import ServiceForm from './ServiceForm.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import { EditIcon, TrashIcon, SparkIcon } from '../common/Icons.jsx';

export default function ServiceList({ services, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (editingId && !services.some((service) => service.id === editingId)) {
      setEditingId(null);
    }
    if (deleteId && !services.some((service) => service.id === deleteId)) {
      setDeleteId(null);
    }
  }, [deleteId, editingId, services]);

  const handleDelete = async () => {
    await onDelete(deleteId);
    setDeleteId(null);
  };

  if (services.length === 0) {
    return (
      <div className="tech-card tech-card--subtle rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300">
          <SparkIcon className="h-5 w-5" />
        </div>
        <p className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">No tienes servicios configurados</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Agrega un servicio para que el bot pueda ofrecerlo y cotizarlo.</p>
      </div>
    );
  }

  return (
    <>
      <div className="tech-card overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Servicio</th>
              <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Duración</th>
              <th className="px-5 py-4 text-left font-semibold uppercase tracking-[0.18em]">Precio</th>
              <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {services.map((service) => (
              <FragmentRow
                key={service.id}
                service={service}
                isEditing={editingId === service.id}
                onToggleEdit={() => setEditingId(editingId === service.id ? null : service.id)}
                onUpdate={onUpdate}
                onDelete={() => setDeleteId(service.id)}
                onCloseEdit={() => setEditingId(null)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Eliminar servicio"
        message="El servicio se quitará del catálogo. Las citas anteriores no se verán afectadas."
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}

function FragmentRow({ service, isEditing, onToggleEdit, onUpdate, onDelete, onCloseEdit }) {
  return (
    <>
      <tr className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
        <td className="px-5 py-4">
          <p className="font-semibold text-slate-950 dark:text-slate-50">{service.name}</p>
          {service.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{service.description}</p>}
        </td>
        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{service.durationMin} min</td>
        <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-200">${parseFloat(service.price).toFixed(2)}</td>
        <td className="px-5 py-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={onToggleEdit}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <EditIcon className="h-4 w-4" />
              Editar
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
            >
              <TrashIcon className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </td>
      </tr>

      {isEditing && (
        <tr>
          <td colSpan={4} className="px-5 pb-5">
            <ServiceForm
              initial={service}
              onSubmit={async (data) => {
                await onUpdate(service.id, data);
                onCloseEdit();
              }}
              onCancel={onCloseEdit}
            />
          </td>
        </tr>
      )}
    </>
  );
}
