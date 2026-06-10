import { useEffect, useMemo, useState } from 'react';
import ServiceList from '../components/services/ServiceList.jsx';
import ServiceForm from '../components/services/ServiceForm.jsx';
import { useServices } from '../hooks/useServices.js';
import { MessagesIcon, PlusIcon, SparkIcon } from '../components/common/Icons.jsx';

export default function Services() {
  const { services, loading, fetchServices, createService, updateService, deleteService } = useServices();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const totals = useMemo(() => {
    const active = services.filter((s) => s.active !== false).length;
    const avgDuration = services.length
      ? Math.round(services.reduce((sum, item) => sum + Number(item.durationMin ?? 0), 0) / services.length)
      : 0;
    const maxPrice = services.length ? Math.max(...services.map((item) => Number(item.price ?? 0))) : 0;
    return { active, avgDuration, maxPrice };
  }, [services]);

  const handleCreate = async (data) => {
    await createService(data);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <section className="app-card overflow-hidden">
        <div className="soft-grid rounded-3xl bg-gradient-to-r from-slate-950 to-emerald-950 px-6 py-6 text-white sm:px-8 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <MessagesIcon className="h-4 w-4 text-emerald-300" />
                Catálogo de servicios
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Servicios claros para que el bot cotice y agende sin fricción.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-200/90 dark:text-slate-200">
                La base funcional se mantiene, pero ahora con una presentación más limpia y una jerarquía visual más cercana a la segunda propuesta.
              </p>
            </div>

            <button onClick={() => setShowForm((v) => !v)} className="app-button rounded-2xl bg-white text-slate-950 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700">
              <PlusIcon className="h-4 w-4" />
              {showForm ? 'Cerrar formulario' : 'Agregar'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Servicios activos" value={totals.active} icon={SparkIcon} tone="emerald" />
        <Kpi label="Duración promedio" value={`${totals.avgDuration} min`} icon={MessagesIcon} tone="sky" />
        <Kpi label="Precio máximo" value={`$${totals.maxPrice.toFixed(2)}`} icon={SparkIcon} tone="violet" />
      </section>

      {showForm && <ServiceForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}

      <div className="app-card p-4 sm:p-5">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Cargando servicios...</div>
        ) : (
          <ServiceList services={services} onUpdate={updateService} onDelete={deleteService} />
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  };

  return (
    <div className="app-card px-5 py-5">
      <div className="flex items-start justify-between gap-3">
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
