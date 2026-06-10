import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon } from '../common/Icons.jsx';

const STATUS_COLORS = {
  CONFIRMED: '#16a34a',
  PENDING: '#d97706',
  CANCELLED: '#dc2626',
  NO_SHOW: '#64748b',
};

export default function CalendarView({ appointments, onEventClick, onDateSelect }) {
  const calendarRef = useRef(null);

  const events = appointments.map((a) => ({
    id: a.id,
    title: `${a.customerName} - ${a.service?.name ?? ''}`,
    start: a.scheduledAt,
    end: a.endsAt,
    backgroundColor: STATUS_COLORS[a.status] ?? STATUS_COLORS.CONFIRMED,
    borderColor: 'transparent',
    extendedProps: a,
  }));

  return (
    <div className="calendar-surface overflow-hidden rounded-3xl border border-slate-200 shadow-sm dark:border-slate-700">
      <div className="calendar-surface__header flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200 shadow-sm">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950 dark:text-slate-50">Vista de calendario</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">Agenda semanal, diaria y selección rápida de horarios</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => calendarRef.current?.getApi()?.prev()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-100 dark:hover:bg-emerald-500/25"
            aria-label="Anterior"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => calendarRef.current?.getApi()?.today()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <ClockIcon className="h-4 w-4" />
            Hoy
          </button>
          <button
            type="button"
            onClick={() => calendarRef.current?.getApi()?.next()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-100 dark:hover:bg-emerald-500/25"
            aria-label="Siguiente"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="calendar-surface__body p-4 sm:p-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={esLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
          }}
          events={events}
          eventClick={(info) => onEventClick?.(info.event.extendedProps)}
          selectable
          select={(info) => onDateSelect?.(info)}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          height="auto"
          eventDisplay="block"
          nowIndicator
        />
      </div>
    </div>
  );
}
