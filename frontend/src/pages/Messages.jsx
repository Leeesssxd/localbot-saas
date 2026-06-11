import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessagesIcon, SparkIcon, UsersIcon, ClockIcon } from '../components/common/Icons.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { useAppDataRefresh } from '../hooks/useAppDataRefresh.js';
import { useAppointments } from '../hooks/useAppointments.js';
import { useConversations } from '../hooks/useConversations.js';

export default function Messages() {
  const {
    conversations,
    selectedPhone,
    thread,
    loading,
    threadLoading,
    error,
    threadError,
    fetchConversations,
    fetchThread,
    sendReply,
  } = useConversations();
  const { updateAppointment, rescheduleAppointment } = useAppointments();
  const [query, setQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState(null);
  const [actionError, setActionError] = useState('');
  const [rescheduleAt, setRescheduleAt] = useState('');
  const [searchParams] = useSearchParams();
  const deepLinkedPhone = searchParams.get('phone');

  useEffect(() => {
    fetchConversations(30);
  }, [fetchConversations]);

  const refreshMessages = useCallback(() => {
    fetchConversations(30);
  }, [fetchConversations]);

  useAppDataRefresh(refreshMessages);

  useEffect(() => {
    if (conversations[0]?.customerPhone && !thread) {
      fetchThread(conversations[0].customerPhone);
    }
  }, [conversations, fetchThread, thread]);

  useEffect(() => {
    if (!deepLinkedPhone) return;
    const match = conversations.find((item) => item.customerPhone === deepLinkedPhone);
    if (match) {
      fetchThread(match.customerPhone);
      setQuery('');
    }
  }, [conversations, deepLinkedPhone, fetchThread]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations;

    return conversations.filter((item) => {
      return [
        item.customerName,
        item.customerPhone,
        item.preview,
        item.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [conversations, query]);

  const stats = useMemo(() => ({
    total: conversations.length,
    urgent: conversations.filter((item) => item.tone === 'amber').length,
    active: conversations.filter((item) => item.lastDirection === 'IN').length,
    confirmed: conversations.filter((item) => item.tone === 'emerald').length,
  }), [conversations]);

  const selected = conversations.find((item) => item.customerPhone === selectedPhone)
    ?? (thread?.customerPhone ? conversations.find((item) => item.customerPhone === thread.customerPhone) : null)
    ?? filtered[0];

  useEffect(() => {
    if (selected?.nextAppointment?.scheduledAt) {
      setRescheduleAt(toLocalDateTimeValue(selected.nextAppointment.scheduledAt));
    } else {
      setRescheduleAt('');
    }
  }, [selected?.nextAppointment?.scheduledAt]);

  const handleSelect = async (item) => {
    await fetchThread(item.customerPhone);
    setReplyText('');
    setSendError('');
    setActionError('');
    setActionDialog(null);
    setRescheduleAt(item.nextAppointment?.scheduledAt ? toLocalDateTimeValue(item.nextAppointment.scheduledAt) : '');
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selected?.customerPhone || !replyText.trim()) return;

    setSending(true);
    setSendError('');

    try {
      await sendReply(selected.customerPhone, replyText);
      setReplyText('');
      await fetchConversations(30);
    } catch (err) {
      setSendError(err.response?.data?.error ?? err.message ?? 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const executeAppointmentAction = async () => {
    if (!selected?.nextAppointment || !actionDialog) return;

    setActionLoading(true);
    setActionError('');
    try {
      await updateAppointment(
        selected.nextAppointment.id,
        actionDialog.status,
        actionDialog.notes
      );
      await Promise.all([
        fetchThread(selected.customerPhone),
        fetchConversations(30),
      ]);
      setActionDialog(null);
    } catch (err) {
      setActionError(err.response?.data?.error ?? err.message ?? 'No se pudo actualizar la cita.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selected?.nextAppointment || !rescheduleAt) return;

    setActionLoading(true);
    setActionError('');
    try {
      await rescheduleAppointment(
        selected.nextAppointment.id,
        new Date(rescheduleAt).toISOString(),
        'Reagendada desde el panel de mensajes'
      );
      await Promise.all([
        fetchThread(selected.customerPhone),
        fetchConversations(30),
      ]);
    } catch (err) {
      setActionError(err.response?.data?.error ?? err.message ?? 'No se pudo reagendar la cita.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="app-card overflow-hidden">
        <div className="config-hero relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_28%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <MessagesIcon className="h-4 w-4 text-emerald-300" />
                Centro de mensajes
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Conversaciones reales, sincronizadas con el historial de WhatsApp.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-200/90">
                Aquí ves el resumen operativo de cada cliente, el hilo completo y el estado de sus últimas interacciones sin depender de datos simulados.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Metric label="Chats" value={stats.total} />
              <Metric label="Urgentes" value={stats.urgent} />
              <Metric label="Entrantes" value={stats.active} />
              <Metric label="Bot" value={stats.confirmed} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.42fr_0.58fr]">
        <div className="app-card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-slate-50">Conversaciones</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Selecciona un hilo para ver el contexto completo.</p>
              </div>
              <span className="app-chip">{filtered.length} visibles</span>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
              <ClockIcon className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, teléfono o mensaje"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="max-h-[720px] overflow-y-auto">
            {loading ? (
              <div className="px-5 py-10 text-sm text-slate-400 dark:text-slate-500">Cargando conversaciones...</div>
            ) : error ? (
              <div className="px-5 py-10 text-sm text-rose-600 dark:text-rose-300">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <UsersIcon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-950 dark:text-slate-50">No hay conversaciones que coincidan</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Prueba con otro nombre, teléfono o palabra del último mensaje.</p>
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.customerPhone}
                  onClick={() => handleSelect(item)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 ${
                    selected?.customerPhone === item.customerPhone ? 'bg-emerald-50/80 dark:bg-emerald-500/10' : ''
                  }`}
                >
                  <ConversationBadge tone={item.tone} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{item.customerName}</p>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{item.preview}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      <span>{item.status}</span>
                      <span>•</span>
                      <span>{item.customerPhone}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="app-card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Hilo activo</p>
                <h3 className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-50">
                  {selected?.customerName ?? 'Selecciona una conversación'}
                </h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass(selected?.tone)}`}>
                {selected?.status ?? 'Sin estado'}
              </span>
            </div>
            {selected && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="app-chip">Tel: {selected.customerPhone}</span>
                <span className="app-chip">Mensajes: {selected.messageCount}</span>
                {selected.nextAppointment ? (
                  <span className="app-chip">
                    Próxima cita: {selected.nextAppointment.service?.name ?? 'Servicio'}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6">
            {threadLoading ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                Cargando hilo...
              </div>
            ) : threadError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                {threadError}
              </div>
            ) : thread?.messages?.length ? (
              <div className="space-y-3 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                {thread.messages.map((message, index) => (
                  <MessageBubble
                    key={`${message.role}-${message.createdAt}-${index}`}
                    role={message.role}
                    text={message.content}
                    time={message.createdAt}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                Selecciona una conversación para ver el historial completo.
              </div>
            )}

            {selected?.nextAppointment && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Cita vinculada</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-semibold text-slate-950 dark:text-slate-50">
                    {selected.nextAppointment.service?.name ?? 'Servicio'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {new Date(selected.nextAppointment.scheduledAt).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  <span className="app-chip">{selected.nextAppointment.status}</span>
                </div>

                {(selected.nextAppointment.status === 'CONFIRMED' || selected.nextAppointment.status === 'PENDING') && (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setActionDialog({
                        title: 'Cancelar cita',
                        message: `La cita de ${selected.customerName} se marcará como cancelada.`,
                        confirmLabel: 'Cancelar cita',
                        status: 'CANCELLED',
                        notes: 'Cancelada desde el panel de mensajes',
                      })}
                      className="app-button rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    >
                      Cancelar cita
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionDialog({
                        title: 'Marcar no asistió',
                        message: `La cita de ${selected.customerName} se marcará como no asistió.`,
                        confirmLabel: 'Marcar no asistió',
                        status: 'NO_SHOW',
                        notes: 'Marcada desde el panel de mensajes',
                      })}
                      className="app-button rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Marcar no asistió
                    </button>
                  </div>
                )}

                {(selected.nextAppointment.status === 'CONFIRMED' || selected.nextAppointment.status === 'PENDING') && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Reagendar cita</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                          Nueva fecha y hora
                        </label>
                        <input
                          type="datetime-local"
                          value={rescheduleAt}
                          onChange={(e) => setRescheduleAt(e.target.value)}
                          className="app-input"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleReschedule}
                        disabled={!rescheduleAt || actionLoading}
                        className="app-button-primary rounded-2xl disabled:opacity-50"
                      >
                        {actionLoading ? 'Reagendando...' : 'Reagendar'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      La cita se moverá a la nueva fecha conservando la duración del servicio.
                    </p>
                  </div>
                )}
              </div>
            )}

            {actionError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSendReply} className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Respuesta manual</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Envía un mensaje directo al cliente por WhatsApp.</p>
                </div>
                <span className="app-chip">Operativo</span>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={selected ? `Responder a ${selected.customerName}...` : 'Selecciona una conversación'}
                rows={4}
                className="app-textarea mt-4"
                disabled={!selected?.customerPhone}
              />

              {sendError && (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {sendError}
                </div>
              )}

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setReplyText('')}
                  className="app-button-secondary"
                  disabled={!replyText}
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={!selected?.customerPhone || !replyText.trim() || sending}
                  className="app-button-primary disabled:opacity-50"
                >
                  {sending ? 'Enviando...' : 'Enviar respuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <ConfirmDialog
        isOpen={!!actionDialog}
        title={actionDialog?.title ?? ''}
        message={actionDialog?.message ?? ''}
        confirmLabel={actionDialog?.confirmLabel ?? 'Confirmar'}
        danger={actionDialog?.status === 'CANCELLED'}
        loading={actionLoading}
        onCancel={() => setActionDialog(null)}
        onConfirm={executeAppointmentAction}
      />
    </div>
  );
}

function toLocalDateTimeValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - (offset * 60 * 1000));
  return local.toISOString().slice(0, 16);
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function ConversationBadge({ tone }) {
  const toneMap = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
    slate: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${toneMap[tone] ?? toneMap.slate}`}>
      <MessagesIcon className="h-4 w-4" />
    </div>
  );
}

function MessageBubble({ role, text, time }) {
  const fromBot = role === 'assistant';

  return (
    <div className={`flex ${fromBot ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${
          fromBot
            ? 'bg-emerald-600 text-white'
            : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
        }`}
      >
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
          {fromBot ? 'LocalBot' : 'Cliente'}
        </p>
        <p>{text}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] opacity-60">
          {new Date(time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function toneClass(tone) {
  const map = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };
  return map[tone] ?? map.slate;
}
