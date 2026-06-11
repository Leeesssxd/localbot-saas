import { BrandMark } from './Icons.jsx';

const CARDS = [
  { width: 'w-44', bar: 'w-20' },
  { width: 'w-36', bar: 'w-16' },
  { width: 'w-48', bar: 'w-24' },
];

export default function RouteLoader() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.1),transparent_24%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="app-card w-full max-w-3xl overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-slate-950 p-3 shadow-xl shadow-slate-950/20">
              <BrandMark className="h-full w-full animate-pulse" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                Cargando LocalBot
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
                Preparando el panel con tus datos reales.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Estamos separando las rutas para que el inicio sea más rápido y el panel se sienta más ágil mientras se carga solo lo necesario.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {CARDS.map((card, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                    <div className={`h-2 rounded-full bg-slate-200/90 dark:bg-slate-700 ${card.bar} animate-pulse`} />
                    <div className="mt-3 h-6 w-24 rounded-full bg-slate-200/80 dark:bg-slate-700 animate-pulse" />
                    <div className={`mt-2 h-3 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse ${card.width}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
