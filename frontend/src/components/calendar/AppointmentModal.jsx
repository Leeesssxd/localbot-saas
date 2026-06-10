import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, ClockIcon, MessagesIcon, UsersIcon, XIcon } from '../common/Icons.jsx';

const STATUS_LABELS = {
  CONFIRMED: { label: 'Confirmada', tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
  PENDING: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  CANCELLED: { label: 'Cancelada', tone: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' },
  NO_SHOW: { label: 'No asistió', tone: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

export default function AppointmentModal({ appointment, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);

  if (!appointment) return null;

  const start = new Date(appointment.scheduledAt ?? appointment.start);
  const end = new Date(appointment.endsAt ?? appointment.end);
  const statusInfo = STATUS_LABELS[appointment.status] ?? STATUS_LABELS.CONFIRMED;

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await onUpdate(appointment.id, newStatus);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button type="button" className="absolute inset-0 bg-slate-950/50" onClick={onClose} aria-label="Cerrar modal" />
      <div className="tech-card relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400 dark:text-slate-500">Detalle de cita</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">Cita programada</h3>
            <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.tone}`}>
              {statusInfo.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoTile icon={MessagesIcon} label="Servicio" value={appointment.service?.name ?? appointment.title} />
          <InfoTile icon={UsersIcon} label="Cliente" value={appointment.customerName} />
          <InfoTile icon={ClockIcon} label="Horario" value={`${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`} />
          <InfoTile icon={CalendarIcon} label="Fecha" value={format(start, "EEEE d 'de' MMMM yyyy", { locale: es })} />
        </div>

        {appointment.customerPhone && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Contacto</p>
            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{appointment.customerPhone}</p>
          </div>
        )}

        {appointment.notes && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Notas</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{appointment.notes}</p>
          </div>
        )}

        {(appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              disabled={loading}
              onClick={() => handleStatusChange('CANCELLED')}
              className="app-button rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              Cancelar cita
            </button>
            <button
              disabled={loading}
              onClick={() => handleStatusChange('NO_SHOW')}
              className="app-button rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Marcar no asistió
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="tech-card tech-card--subtle rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
        {label}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
