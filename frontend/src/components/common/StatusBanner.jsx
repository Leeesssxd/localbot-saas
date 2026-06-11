import { differenceInDays } from 'date-fns';
import { useTenantStore } from '../../store/tenant.store.js';
import { ClockIcon, ShieldIcon, SparkIcon } from './Icons.jsx';

export default function StatusBanner() {
  const tenant = useTenantStore((s) => s.tenant);
  if (!tenant) return null;

  const { status, trialEnd } = tenant;

  if (status === 'ACTIVE') return null;

  if (status === 'TRIAL') {
    const daysLeft = differenceInDays(new Date(trialEnd), new Date());
    const urgent = daysLeft <= 5;
    const message = daysLeft > 0
      ? `Período de prueba: ${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}.`
      : daysLeft === 0
        ? 'Tu período de prueba venció hoy.'
        : `Tu período de prueba venció hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) !== 1 ? 's' : ''}.`;

    return (
      <div
        className={`border-b ${
          urgent
            ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100'
            : 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 text-sm sm:px-6 lg:px-8">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              urgent
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
                : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200'
            }`}
          >
            {urgent ? <ClockIcon className="h-4 w-4" /> : <SparkIcon className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{message}</p>
            <p className="text-xs opacity-80">Para continuar usando LocalBot, contacta a soporte o actualiza tu plan.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'SUSPENDED' || status === 'CANCELLED') {
    return (
      <div className="border-b border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 text-sm sm:px-6 lg:px-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
            <ShieldIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">
              Tu cuenta está {status === 'SUSPENDED' ? 'suspendida' : 'cancelada'}.
            </p>
            <p className="text-xs opacity-80">El bot no está respondiendo mensajes. Contacta a soporte para reactivar el servicio.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
