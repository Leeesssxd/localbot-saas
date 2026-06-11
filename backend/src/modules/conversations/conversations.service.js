import prisma from '../../shared/db.js';
import { sendWhatsAppMessage } from '../whatsapp/whatsapp.client.js';

const DEFAULT_LIMIT = 20;
const HISTORY_FETCH_MULTIPLIER = 12;

export async function listConversationSummaries(tenantId, limit = DEFAULT_LIMIT) {
  const safeLimit = clampLimit(limit);
  const historyRows = await prisma.conversationHistory.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: safeLimit * HISTORY_FETCH_MULTIPLIER,
  });

  const latestAppointments = await prisma.appointment.findMany({
    where: { tenantId },
    include: { service: true },
    orderBy: { scheduledAt: 'desc' },
    take: safeLimit * HISTORY_FETCH_MULTIPLIER,
  });

  const appointmentsByPhone = new Map();
  for (const appointment of latestAppointments) {
    if (!appointmentsByPhone.has(appointment.customerPhone)) {
      appointmentsByPhone.set(appointment.customerPhone, appointment);
    }
  }

  const conversations = new Map();
  for (const row of historyRows) {
    if (!conversations.has(row.customerPhone)) {
      conversations.set(row.customerPhone, []);
    }
    conversations.get(row.customerPhone).push(row);
  }

  const summaries = [];

  for (const [customerPhone, rows] of conversations.entries()) {
    if (summaries.length >= safeLimit) break;

    const thread = rows.slice().reverse();
    const lastUser = [...rows].find((row) => row.role === 'user');
    const lastAssistant = [...rows].find((row) => row.role === 'assistant');
    const latestRow = rows[0];
    const latestAppointment = appointmentsByPhone.get(customerPhone) ?? null;
    const lastMessage = thread[thread.length - 1] ?? null;
    const inboundCount = rows.filter((row) => row.role === 'user').length;
    const outboundCount = rows.filter((row) => row.role === 'assistant').length;

    summaries.push({
      customerPhone,
      customerName: inferCustomerName(lastUser?.content, latestAppointment?.customerName, customerPhone),
      preview: derivePreview(lastMessage?.content ?? latestRow.content),
      status: deriveStatus({ lastUser, lastAssistant, latestAppointment, latestRow }),
      tone: deriveTone({ lastUser, lastAssistant, latestAppointment, latestRow }),
      updatedAt: latestRow.createdAt,
      lastDirection: latestRow.role === 'user' ? 'IN' : 'OUT',
      messageCount: rows.length,
      inboundCount,
      outboundCount,
      appointmentCount: latestAppointment ? 1 : 0,
      nextAppointment: latestAppointment
        ? {
            id: latestAppointment.id,
            status: latestAppointment.status,
            scheduledAt: latestAppointment.scheduledAt,
            endsAt: latestAppointment.endsAt,
            service: latestAppointment.service,
          }
        : null,
    });
  }

  summaries.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return summaries;
}

export async function getConversationThread(tenantId, customerPhone) {
  const [messages, appointments] = await Promise.all([
    prisma.conversationHistory.findMany({
      where: { tenantId, customerPhone },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.appointment.findMany({
      where: { tenantId, customerPhone },
      include: { service: true },
      orderBy: { scheduledAt: 'asc' },
    }),
  ]);

  return {
    customerPhone,
    messages,
    appointments,
  };
}

export async function sendConversationReply({ tenantId, tenant, customerPhone, text }) {
  const trimmed = (text ?? '').trim();
  if (!trimmed) {
    throw new Error('Message text is required');
  }

  const ok = await sendWhatsAppMessage(tenant, customerPhone, trimmed);
  if (!ok) {
    throw new Error('No se pudo enviar el mensaje por WhatsApp.');
  }

  await prisma.conversationHistory.create({
    data: {
      tenantId,
      customerPhone,
      role: 'assistant',
      content: trimmed,
    },
  });

  await prisma.webhookLog.create({
    data: {
      tenantId,
      direction: 'OUT',
      toPhone: customerPhone,
      content: trimmed,
      status: 'PROCESSED',
    },
  });

  return {
    customerPhone,
    content: trimmed,
    role: 'assistant',
    createdAt: new Date().toISOString(),
  };
}

function clampLimit(limit) {
  const parsed = Number.parseInt(limit, 10);
  if (Number.isNaN(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(parsed, 1), 50);
}

function derivePreview(content) {
  return truncate(content?.trim() || 'Sin actividad reciente', 92);
}

function inferCustomerName(userMessage, appointmentName, fallbackPhone) {
  if (appointmentName?.trim()) return appointmentName.trim();

  const candidates = [
    /(?:me llamo|soy|mi nombre es)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\- ]{2,40})/i,
    /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\- ]{3,40})$/i,
  ];

  const source = userMessage?.trim() ?? '';
  for (const regex of candidates) {
    const match = source.match(regex);
    if (match?.[1]) {
      return match[1].trim().replace(/\s+/g, ' ');
    }
  }

  return formatPhoneFallback(fallbackPhone);
}

function deriveStatus({ lastUser, lastAssistant, latestAppointment, latestRow }) {
  const userText = (lastUser?.content ?? '').toLowerCase();
  const assistantText = (lastAssistant?.content ?? '').toLowerCase();
  const latestText = (latestRow?.content ?? '').toLowerCase();

  if (userText.includes('cancel') || userText.includes('reagend') || userText.includes('mover')) {
    return 'Requiere atención';
  }

  if (latestAppointment?.status === 'PENDING') {
    return 'Pendiente de confirmación';
  }

  if (latestAppointment?.status === 'CONFIRMED' && assistantText.includes('cita confirmada')) {
    return 'Confirmada';
  }

  if (latestText.includes('?')) {
    return 'Consulta abierta';
  }

  return 'En seguimiento';
}

function deriveTone({ lastUser, lastAssistant, latestAppointment }) {
  const userText = (lastUser?.content ?? '').toLowerCase();

  if (userText.includes('cancel') || userText.includes('reagend') || userText.includes('mover')) return 'amber';
  if (latestAppointment?.status === 'CONFIRMED') return 'emerald';
  if (latestAppointment?.status === 'PENDING') return 'sky';
  if ((lastAssistant?.content ?? '').toLowerCase().includes('listo')) return 'emerald';
  return 'slate';
}

function truncate(text, maxLength) {
  const value = text ?? '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function formatPhoneFallback(phone) {
  if (!phone) return 'Cliente';
  const lastDigits = phone.replace(/\D/g, '').slice(-4);
  return lastDigits ? `Cliente ${lastDigits}` : 'Cliente';
}
