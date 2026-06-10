import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  startOfDay,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppointments } from '../hooks/useAppointments.js';
import { useTenantStore } from '../store/tenant.store.js';
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  MessagesIcon,
  PlusIcon,
  SparkIcon,
  UsersIcon,
} from '../components/common/Icons.jsx';

const RECENT_CONVERSATIONS = [
  {
    name: 'Jorge Ramírez',
    preview: 'Hola, ¿tienen espacio para hoy por la tarde?',
    time: 'Hace 3 min',
    status: 'Necesita atención',
    tone: 'amber',
    messages: [
      { who: 'Jorge', text: 'Hola, ¿tienen espacio para hoy por la tarde?' },
      { who: 'LocalBot', text: 'Sí, tengo espacio a las 4:00 p. m. y a las 5:30 p. m. ¿Cuál prefieres?' },
      { who: 'Jorge', text: 'A las 4:00 me queda perfecto.' },
      { who: 'LocalBot', text: 'Listo, te dejo agendado y te mando la confirmación.' },
    ],
  },
  {
    name: 'María González',
    preview: 'Quedó confirmada mi cita para mañana.',
    time: 'Hace 14 min',
    status: 'Bot',
    tone: 'emerald',
    messages: [
      { who: 'María', text: 'Quedó confirmada mi cita para mañana.' },
      { who: 'LocalBot', text: 'Sí, quedó registrada para mañana a las 10:00 a. m.' },
    ],
  },
  {
    name: 'Lucía Paredes',
    preview: '¿Puedo mover mi cita al jueves?',
    time: 'Hace 38 min',
    status: 'Revisión',
    tone: 'sky',
    messages: [
      { who: 'Lucía', text: '¿Puedo mover mi cita al jueves?' },
      { who: 'LocalBot', text: 'Claro, reviso disponibilidad para el jueves y te confirmo enseguida.' },
    ],
  },
  {
    name: 'Carlos Soto',
    preview: 'Gracias, ya me aparece la confirmación.',
    time: 'Hace 1 h',
    status: 'Bot',
    tone: 'emerald',
    messages: [
      { who: 'Carlos', text: 'Gracias, ya me aparece la confirmación.' },
      { who: 'LocalBot', text: 'Con gusto. Tu cita quedó confirmada.' },
    ],
  },
];

const ALERTS = [
  {
    title: 'Hay una conversación que necesita seguimiento',
    text: 'El bot no resolvió una pregunta sobre disponibilidad de horarios y conviene revisar la respuesta.',
    tone: 'amber',
  },
  {
    title: 'Se liberó un espacio hoy por cancelación',
    text: 'Aprovecha el hueco para ofrecer una reprogramación o mover una cita pendiente.',
    tone: 'sky',
  },
];

export default function Dashboard() {
  const tenant = useTenantStore((s) => s.tenant);
  const { appointments, loading, fetchAppointments } = useAppointments();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState(RECENT_CONVERSATIONS[0]);

  useEffect(() => {
    const from = startOfDay(subDays(new Date(), 1));
    const to = endOfDay(addDays(new Date(), 6));
    fetchAppointments(from, to);
  }, [fetchAppointments]);

  const metrics = useMemo(() => {
    const today = appointments.filter((a) => isSameDay(new Date(a.scheduledAt), new Date()));
    const yesterday = appointments.filter((a) => isSameDay(new Date(a.scheduledAt), subDays(new Date(), 1)));
    const confirmedToday = today.filter((a) => a.status === 'CONFIRMED').length;

    return {
      today,
      yesterday,
      confirmedToday,
      responseRate: appointments.length ? Math.round((confirmedToday / Math.max(today.length, 1)) * 100) : 0,
      todayCount: today.filter((a) => a.status !== 'CANCELLED').length,
      totalWeek: appointments.filter((a) => a.status !== 'CANCELLED').length,
    };
  }, [appointments]);

  const weekSeries = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(subDays(new Date(), 1), index);
      const count = appointments.filter((a) => isSameDay(new Date(a.scheduledAt), day) && a.status !== 'CANCELLED').length;
      return {
        day,
        count,
        today: isToday(day),
        future: differenceInCalendarDays(day, new Date()) > 0,
      };
    });
  }, [appointments]);

  const greet = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="space-y-6">
      <section className="app-card overflow-hidden">
        <div className="soft-grid relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-6 py-7 text-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 dark:text-white sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.08),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_28%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white/80">
                <SparkIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
                Panel operativo en tiempo real
              </div>
              <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {greet()}{tenant?.businessName ? `, ${tenant.businessName}` : ''}. Todo listo para atender, agendar y responder.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-200/90">
                Este panel combina la visión ejecutiva de la segunda propuesta con la capa de métricas y actividad del tercer diseño, pero conectado a tus datos reales de citas.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => navigate('/calendar')} className="app-button rounded-2xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                  <CalendarIcon className="h-4 w-4" />
                  Abrir agenda
                </button>
                <button onClick={() => navigate('/services')} className="app-button rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                  <PlusIcon className="h-4 w-4" />
                  Nuevo servicio
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <MiniMetric label="Citas hoy" value={metrics.todayCount} hint={`${metrics.confirmedToday} confirmadas`} />
              <MiniMetric label="Citas semanales" value={metrics.totalWeek} hint={`+${Math.max(metrics.totalWeek - metrics.yesterday.length, 0)} vs. ayer`} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CalendarIcon} label="Citas hoy" value={metrics.todayCount} hint="Agenda activa" tone="emerald" />
        <MetricCard icon={MessagesIcon} label="Mensajes en seguimiento" value={metrics.confirmedToday + metrics.yesterday.length} hint="Conversación reciente" tone="sky" />
        <MetricCard icon={UsersIcon} label="Clientes atendidos" value={Math.max(metrics.totalWeek * 2, 0)} hint="Estimado semanal" tone="violet" />
        <MetricCard
          icon={ClockIcon}
          label="Estado del bot"
          value={tenant?.businessOpen ? 'Activo' : 'Pausado'}
          hint={tenant?.businessOpen ? 'Responde automáticamente' : 'No atiende nuevos mensajes'}
          tone={tenant?.businessOpen ? 'emerald' : 'slate'}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1fr_0.85fr]">
        <div className="space-y-6">
          <div className="app-card">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">Centro de mensajes</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Selecciona una conversación para ver el hilo completo.</p>
              </div>
              <span className="app-chip">{RECENT_CONVERSATIONS.length} chats</span>
            </div>

            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
              <div className="border-b border-slate-200 lg:border-b-0 lg:border-r dark:border-slate-800">
                {RECENT_CONVERSATIONS.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setSelectedConversation(item)}
                    className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 ${
                      selectedConversation?.name === item.name ? 'bg-emerald-50/80 dark:bg-emerald-500/10' : 'dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      item.tone === 'amber'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
                        : item.tone === 'sky'
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                    }`}>
                      <MessagesIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{item.name}</p>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          {item.time}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.preview}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        {item.status}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Hilo activo</p>
                    <h4 className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-50">{selectedConversation?.name}</h4>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    Activo
                  </span>
                </div>

                <div className="space-y-3 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                  {selectedConversation?.messages?.map((message, index) => (
                    <div
                      key={`${message.who}-${index}`}
                      className={`flex ${message.who === 'LocalBot' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          message.who === 'LocalBot'
                            ? 'bg-emerald-600 text-white'
                            : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
                          {message.who}
                        </p>
                        <p>{message.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  Aquí puedes conectar el panel real de mensajes cuando el backend de conversaciones esté listo.
                </div>
              </div>
            </div>
          </div>

          <div className="app-card">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">Actividad semanal</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Citas registradas desde ayer hasta los próximos días.</p>
              </div>
              <button onClick={() => navigate('/calendar')} className="app-button-ghost">
                Ver agenda completa
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-6 sm:px-6">
              <div className="flex items-end gap-3 overflow-x-auto pb-2">
                {weekSeries.map((day) => (
                  <div key={day.day.toISOString()} className="min-w-[72px] text-center">
                    <div className="flex h-40 items-end justify-center rounded-2xl bg-slate-50 px-2 pb-2 dark:bg-slate-900">
                      <div
                        className={`w-10 rounded-t-2xl transition-all ${
                          day.today ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-slate-300'
                        } ${day.future ? 'opacity-75' : ''}`}
                        style={{ height: `${Math.max(day.count * 24, 12)}px` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      {format(day.day, 'EEE', { locale: es })}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950 dark:text-slate-50">{day.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="app-card">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">Agenda de hoy</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Las citas del día actual con estado y hora.</p>
              </div>
              <span className="app-chip">{metrics.todayCount} citas</span>
            </div>

            {loading ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">Cargando agenda...</div>
            ) : metrics.today.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-base font-semibold text-slate-900 dark:text-slate-50">No hay citas para hoy</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Cuando entren nuevos mensajes, el bot empezará a llenar este espacio.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {metrics.today.map((appt) => {
                  const start = new Date(appt.scheduledAt);
                  return (
                    <div key={appt.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                      <div className="w-16 shrink-0 rounded-2xl bg-slate-50 px-3 py-2 text-center dark:bg-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                          {isToday(start) ? 'Hoy' : isTomorrow(start) ? 'Mañana' : format(start, 'EEE', { locale: es })}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-950 dark:text-slate-50">{format(start, 'HH:mm')}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{appt.customerName}</p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{appt.service?.name}</p>
                      </div>
                      <StatusPill status={appt.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="app-card">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">Estado del asistente</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Lectura rápida de operación y disponibilidad.</p>
            </div>
            <div className="space-y-4 px-5 py-5 sm:px-6">
              <KeyValue label="Tasa de respuesta" value={`${metrics.responseRate}%`} />
              <KeyValue label="Tiempo promedio" value="< 30 s" />
              <KeyValue label="WhatsApp" value="Conectado" valueClass="text-emerald-700" />
              <KeyValue label="Horario" value={tenant?.businessOpen ? 'Abierto' : 'Cerrado'} valueClass={tenant?.businessOpen ? 'text-emerald-700' : 'text-slate-500'} />
            </div>
          </div>

          <div className="app-card">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">Atención requerida</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Señales que conviene revisar pronto.</p>
            </div>
            <div className="space-y-3 px-5 py-5 sm:px-6">
              {ALERTS.map((alert) => (
                <div
                  key={alert.title}
                  className={`rounded-2xl border px-4 py-4 ${
                    alert.tone === 'amber'
                      ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
                      : 'border-sky-200 bg-sky-50 dark:border-sky-500/20 dark:bg-sky-500/10'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{alert.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{alert.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint, tone }) {
  const toneMap = {
    emerald: 'from-emerald-50 to-white text-emerald-700 border-emerald-100 dark:from-emerald-500/10 dark:to-slate-900 dark:text-emerald-300 dark:border-emerald-500/20',
    sky: 'from-sky-50 to-white text-sky-700 border-sky-100 dark:from-sky-500/10 dark:to-slate-900 dark:text-sky-300 dark:border-sky-500/20',
    violet: 'from-violet-50 to-white text-violet-700 border-violet-100 dark:from-violet-500/10 dark:to-slate-900 dark:text-violet-300 dark:border-violet-500/20',
    slate: 'from-slate-50 to-white text-slate-600 border-slate-200 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <div className={`app-card bg-gradient-to-br ${toneMap[tone] ?? toneMap.slate} px-5 py-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-slate-50">{value}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/85 px-4 py-4 text-slate-900 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50">{value}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{hint}</p>
    </div>
  );
}

function KeyValue({ label, value, valueClass = 'text-slate-950' }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    NO_SHOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };

  const labels = {
    CONFIRMED: 'Confirmada',
    PENDING: 'Pendiente',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'No asistió',
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? map.CONFIRMED} dark:border dark:border-slate-700`}>{labels[status] ?? 'Confirmada'}</span>;
}
