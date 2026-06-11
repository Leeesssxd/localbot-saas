import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addMonths, endOfMonth, startOfMonth } from 'date-fns';
import CalendarView from '../components/calendar/CalendarView.jsx';
import AppointmentModal from '../components/calendar/AppointmentModal.jsx';
import { useAppointments } from '../hooks/useAppointments.js';
import { useAppDataRefresh } from '../hooks/useAppDataRefresh.js';
import { useServices } from '../hooks/useServices.js';
import { CalendarIcon, PlusIcon, SparkIcon } from '../components/common/Icons.jsx';

export default function Calendar() {
  const { appointments, loading, fetchAppointments, updateAppointment, createAppointment } = useAppointments();
  const { services, fetchServices } = useServices();
  const [selected, setSelected] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAppt, setNewAppt] = useState({ serviceId: '', customerName: '', customerPhone: '', scheduledAt: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const deepLinkedAppointmentId = searchParams.get('appointmentId');

  useEffect(() => {
    const from = startOfMonth(new Date());
    const to = endOfMonth(addMonths(new Date(), 1));
    fetchAppointments(from, to);
    fetchServices();
  }, [fetchAppointments, fetchServices]);

  const refreshCalendar = useCallback(() => {
    const from = startOfMonth(new Date());
    const to = endOfMonth(addMonths(new Date(), 1));
    fetchAppointments(from, to);
    fetchServices();
  }, [fetchAppointments, fetchServices]);

  useAppDataRefresh(refreshCalendar);

  useEffect(() => {
    if (!deepLinkedAppointmentId) return;
    const match = appointments.find((item) => item.id === deepLinkedAppointmentId);
    if (match) {
      setSelected(match);
      setShowNewForm(false);
    }
  }, [appointments, deepLinkedAppointmentId]);

  const overview = useMemo(() => {
    const confirmed = appointments.filter((a) => a.status === 'CONFIRMED').length;
    const pending = appointments.filter((a) => a.status === 'PENDING').length;
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length;
    return { confirmed, pending, cancelled, total: appointments.length };
  }, [appointments]);

  const handleNewAppt = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await createAppointment(newAppt);
      setShowNewForm(false);
      setNewAppt({ serviceId: '', customerName: '', customerPhone: '', scheduledAt: '' });
      const from = startOfMonth(new Date());
      const to = endOfMonth(addMonths(new Date(), 1));
      fetchAppointments(from, to);
    } catch (err) {
      setFormError(err.response?.data?.error ?? 'No se pudo crear la cita.');
    } finally {
      setFormLoading(false);
    }
  };

  const setField = (field) => (e) => setNewAppt((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <section className="app-card overflow-hidden">
        <div className="config-hero rounded-3xl bg-gradient-to-r from-slate-950 to-emerald-950 px-6 py-6 text-white sm:px-8 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <SparkIcon className="h-4 w-4 text-emerald-300" />
                Agenda operativa
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Agenda de citas con vista semanal y detalle rápido.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-200/90 dark:text-slate-200">
                Mantiene la estructura funcional del frontend actual, pero con una presentación más premium y un mejor control visual de las citas.
              </p>
            </div>

            <button
              onClick={() => setShowNewForm((v) => !v)}
              className="app-button rounded-2xl bg-white text-slate-950 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
            >
              <PlusIcon className="h-4 w-4" />
              Nueva cita
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={overview.total} icon={CalendarIcon} tone="emerald" />
        <StatCard label="Confirmadas" value={overview.confirmed} icon={SparkIcon} tone="sky" />
        <StatCard label="Pendientes" value={overview.pending} icon={ClockIcon} tone="amber" />
        <StatCard label="Canceladas" value={overview.cancelled} icon={SparkIcon} tone="slate" />
      </section>

      {showNewForm && (
        <div className="app-card p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-950">Nueva cita manual</h3>
            <p className="text-sm text-slate-500">Crea una cita directamente desde el panel.</p>
          </div>
          <form onSubmit={handleNewAppt} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Servicio *">
              <select required value={newAppt.serviceId} onChange={setField('serviceId')} className="app-input">
                <option value="">Seleccionar servicio</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.durationMin} min
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Fecha y hora *">
              <input required type="datetime-local" value={newAppt.scheduledAt} onChange={setField('scheduledAt')} className="app-input" />
            </Field>

            <Field label="Nombre del cliente *">
              <input required type="text" placeholder="Juan Perez" value={newAppt.customerName} onChange={setField('customerName')} className="app-input" />
            </Field>

            <Field label="Telefono del cliente *">
              <input required type="tel" placeholder="521234567890" value={newAppt.customerPhone} onChange={setField('customerPhone')} className="app-input" />
            </Field>

            {formError && (
              <div className="sm:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {formError}
              </div>
            )}

            <div className="sm:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowNewForm(false)} className="app-button-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={formLoading} className="app-button-primary disabled:opacity-50">
                {formLoading ? 'Creando...' : 'Crear cita'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="app-card flex h-96 items-center justify-center text-sm text-slate-400">Cargando agenda...</div>
      ) : (
        <CalendarView appointments={appointments} onEventClick={setSelected} />
      )}

      <AppointmentModal appointment={selected} onClose={() => setSelected(null)} onUpdate={updateAppointment} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className="app-card tech-card px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="tech-card tech-card--subtle">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}
