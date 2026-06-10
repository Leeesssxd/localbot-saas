import { useMemo, useState } from 'react';
import { MessagesIcon, SparkIcon, UsersIcon, ClockIcon } from '../components/common/Icons.jsx';

const CONVERSATIONS = [
  {
    name: 'Jorge Ramírez',
    time: 'Hace 3 min',
    status: 'Necesita atención',
    preview: 'Hola, ¿tienen espacio para hoy por la tarde?',
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
    time: 'Hace 14 min',
    status: 'Bot',
    preview: 'Quedó confirmada mi cita para mañana.',
    tone: 'emerald',
    messages: [
      { who: 'María', text: 'Quedó confirmada mi cita para mañana.' },
      { who: 'LocalBot', text: 'Sí, quedó registrada para mañana a las 10:00 a. m.' },
    ],
  },
  {
    name: 'Lucía Paredes',
    time: 'Hace 38 min',
    status: 'Revisión',
    preview: '¿Puedo mover mi cita al jueves?',
    tone: 'sky',
    messages: [
      { who: 'Lucía', text: '¿Puedo mover mi cita al jueves?' },
      { who: 'LocalBot', text: 'Claro, reviso disponibilidad para el jueves y te confirmo enseguida.' },
    ],
  },
];

export default function Messages() {
  const [selected, setSelected] = useState(CONVERSATIONS[0]);

  const totals = useMemo(() => {
    return {
      total: CONVERSATIONS.length,
      urgent: CONVERSATIONS.filter((c) => c.tone === 'amber').length,
      bot: CONVERSATIONS.filter((c) => c.tone === 'emerald').length,
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="app-card overflow-hidden">
        <div className="config-hero rounded-3xl px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <MessagesIcon className="h-4 w-4 text-emerald-300" />
                Centro de mensajes
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Revisa conversaciones, respuestas y seguimientos desde un solo panel.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-200/90">
                Esta vista junta el listado de conversaciones recientes con el hilo completo de cada cliente para que no tengas que ir y venir entre pantallas.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Metric label="Chats" value={totals.total} />
              <Metric label="Urgentes" value={totals.urgent} />
              <Metric label="Bot" value={totals.bot} />
            </div>
          </div>
        </div>
      </section>

      <section className="app-card overflow-hidden">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-slate-200 lg:border-b-0 lg:border-r dark:border-slate-800">
            {CONVERSATIONS.map((item) => (
              <button
                key={item.name}
                onClick={() => setSelected(item)}
                className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                  selected.name === item.name ? 'bg-emerald-50/80 dark:bg-emerald-500/10' : ''
                }`}
              >
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    item.tone === 'amber'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
                      : item.tone === 'sky'
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                  }`}
                >
                  <ClockIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{item.name}</p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.preview}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{item.status}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Hilo activo</p>
                <h3 className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-50">{selected.name}</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                Activo
              </span>
            </div>

            <div className="space-y-3 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
              {selected.messages.map((message, index) => (
                <div key={`${message.who}-${index}`} className={`flex ${message.who === 'LocalBot' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.who === 'LocalBot'
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">{message.who}</p>
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Aquí podrás conectar el flujo real de WhatsApp cuando termines la integración del backend.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
