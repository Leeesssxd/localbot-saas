import { useEffect, useState } from 'react';
import { useTenantStore } from '../store/tenant.store.js';
import client from '../api/client.js';
import { CopyIcon, GearIcon, ShieldIcon } from '../components/common/Icons.jsx';

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function Settings() {
  const { tenant, fetchTenant, updateTenant } = useTenantStore();
  const [schedule, setSchedule] = useState([]);
  const [saving, setSaving] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    businessName: '',
    closureMessage: '',
    suspendedMessage: '',
  });

  useEffect(() => {
    fetchTenant();
    loadSchedule();
  }, [fetchTenant]);

  useEffect(() => {
    if (tenant) {
      setForm({
        businessName: tenant.businessName ?? '',
        closureMessage: tenant.closureMessage ?? '',
        suspendedMessage: tenant.suspendedMessage ?? '',
      });
    }
  }, [tenant]);

  const loadSchedule = async () => {
    try {
      const { data } = await client.get('/tenants/me/schedule');
      setSchedule(data);
    } catch {}
  };

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTenant(form);
      flashSaved();
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (idx, field, value) => {
    setSchedule((prev) => prev.map((day, i) => (i === idx ? { ...day, [field]: value } : day)));
  };

  const handleSaveSchedule = async () => {
    setScheduleSaving(true);
    try {
      await client.put('/tenants/me/schedule', { days: schedule });
      flashSaved();
    } finally {
      setScheduleSaving(false);
    }
  };

  const webhookUrl = tenant ? `${window.location.origin.replace('5173', '3000')}/webhook/${tenant.id}` : '';

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <section className="app-card overflow-hidden">
        <div className="soft-grid rounded-3xl bg-gradient-to-r from-slate-950 to-emerald-950 px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <GearIcon className="h-4 w-4 text-emerald-300" />
                Configuración del negocio
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Ajusta el comportamiento del bot y la información del local.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-200/90">
                Mantiene la lógica actual de horarios, mensajes y WhatsApp, pero con una interfaz más clara y mucho más pulida.
              </p>
            </div>

            {tenant && (
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-950/50">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 dark:text-slate-400">Tenant</p>
                <p className="mt-1 text-sm font-semibold text-white dark:text-slate-100">{tenant.id}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {saved && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Cambios guardados correctamente.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Section title="Datos del negocio" description="Nombre y mensajes de cierre para el bot.">
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <Field label="Nombre del negocio">
                <input type="text" required value={form.businessName} onChange={setField('businessName')} className="app-input" />
              </Field>

              <Field label="Mensaje de cierre" hint="Cuando el bot está pausado">
                <textarea rows={3} value={form.closureMessage} onChange={setField('closureMessage')} className="app-textarea" />
              </Field>

              <Field label="Mensaje de cuenta suspendida" hint="Si tu plan está inactivo">
                <textarea rows={2} value={form.suspendedMessage} onChange={setField('suspendedMessage')} className="app-textarea" />
              </Field>

              <button type="submit" disabled={saving} className="app-button-primary disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </Section>

          <Section title="Horario de atención" description="Define cuándo puede responder el bot.">
            <div className="space-y-3">
              {schedule.map((day, idx) => (
                <div key={day.dayOfWeek} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-sm font-semibold text-slate-900 dark:text-slate-100">{DAY_NAMES[day.dayOfWeek]}</span>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={day.isOpen}
                          onChange={(e) => updateDay(idx, 'isOpen', e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 accent-emerald-600 dark:border-slate-600"
                        />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{day.isOpen ? 'Abierto' : 'Cerrado'}</span>
                      </label>
                    </div>

                    {day.isOpen ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <input type="time" value={day.openTime} onChange={(e) => updateDay(idx, 'openTime', e.target.value)} className="app-input w-auto" />
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                        <input type="time" value={day.closeTime} onChange={(e) => updateDay(idx, 'closeTime', e.target.value)} className="app-input w-auto" />
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-500">Cerrado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleSaveSchedule} disabled={scheduleSaving} className="mt-5 app-button-primary disabled:opacity-50">
              {scheduleSaving ? 'Guardando...' : 'Guardar horario'}
            </button>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="WhatsApp" description="Datos necesarios para conectar el número de negocio.">
            <div className="space-y-4">
              <InfoRow label="Estado" value={tenant?.status ?? 'Sin datos'} />
              <CopyField label="URL del webhook" value={webhookUrl} onCopy={copyWebhook} copied={copied} />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Token de verificación</p>
                <p className="mt-1 font-mono text-xs text-slate-700 dark:text-slate-300">{tenant?.webhookVerifyToken ?? '—'}</p>
              </div>
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="app-button-secondary w-full justify-center"
              >
                Abrir Meta Developer Portal
              </a>
            </div>
          </Section>

          <Section title="Cuenta" description="Resumen rápido del tenant y estado del plan.">
            <div className="space-y-3">
              <InfoRow label="Plan" value={tenant?.status ?? '—'} />
              <InfoRow label="Bot" value={tenant?.businessOpen ? 'Activo' : 'Pausado'} />
              <InfoRow label="ID" value={<span className="font-mono text-xs text-slate-500 dark:text-slate-400">{tenant?.id ?? '—'}</span>} />
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300">
                  <ShieldIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">Configuración lista para producción</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Cuando conectes Meta o un BSP, este panel ya tiene los campos clave preparados.</p>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <div className="app-card p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        {label}
        {hint ? <span className="ml-1 font-normal normal-case tracking-normal text-slate-500 dark:text-slate-400">({hint})</span> : null}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">{value}</span>
    </div>
  );
}

function CopyField({ label, value, onCopy, copied }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <div className="flex gap-2">
        <input readOnly value={value} className="app-input font-mono text-xs" />
        <button onClick={onCopy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
          <CopyIcon className="h-4 w-4" />
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
