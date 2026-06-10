// modules/webhook/webhook.service.js
// Orchestrates the full lifecycle of an inbound WhatsApp message.
// Follows the 11-step flow defined in README § 3 "Ciclo de Vida Completo".

import prisma from '../../shared/db.js';
import logger from '../../shared/logger.js';
import { extractMessageData } from './webhook.validator.js';
import { getAIClient } from '../ai/ai.client.js';
import { buildPrompt } from '../ai/prompt.builder.js';
import { sendWhatsAppMessage } from '../whatsapp/whatsapp.client.js';
import { bookAppointment, updateAppointmentStatus } from '../appointments/appointments.service.js';
import { getAvailableSlots } from '../appointments/schedule.service.js';

const HISTORY_PAIRS = 10; // last 10 turns = 20 messages
const AVAILABILITY_DAYS = 3;

export async function processInboundMessage(tenantId, payload, metaAppSecret) {
  // ── Step 3: Extract message data ──────────────────────────────────────────
  const msgData = extractMessageData(payload);

  if (!msgData) {
    logger.debug({ tenantId }, 'Ignoring non-text or empty webhook payload');
    return;
  }

  const { waMessageId, fromPhone, text, phoneNumberId } = msgData;
  const ctx = { tenantId, waMessageId, fromPhone };

  // ── Step 3b: Deduplication ─────────────────────────────────────────────────
  const existing = await prisma.webhookLog.findFirst({
    where: { waMessageId, direction: 'IN' },
  });

  if (existing) {
    logger.info(ctx, 'Duplicate message detected — ignoring');
    return;
  }

  // Insert PROCESSING record immediately to block concurrent duplicates
  const logRecord = await prisma.webhookLog.create({
    data: {
      tenantId,
      direction: 'IN',
      waMessageId,
      fromPhone,
      content: text,
      status: 'PROCESSING',
    },
  });

  try {
    // ── Step 4: Load tenant + verify status ─────────────────────────────────
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) {
      logger.warn(ctx, 'Webhook received for unknown tenant — ignoring');
      await updateLog(logRecord.id, 'IGNORED');
      return;
    }

    // Suspended or cancelled — send static message, burn no AI tokens
    if (tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
      logger.info(ctx, `Tenant ${tenant.status} — sending suspension message`);
      await sendWhatsAppMessage(tenant, fromPhone, tenant.suspendedMessage);
      await persistConversationTurn(tenantId, fromPhone, text, tenant.suspendedMessage);
      await updateLog(logRecord.id, 'PROCESSED');
      return;
    }

    // The assistant keeps working even if the business is marked closed.
    // We only use businessOpen as context for future features/analytics.
    if (!tenant.businessOpen) {
      logger.info(ctx, 'Business marked closed — continuing normal AI flow');
    }

    const cancellationIntent = isCancellationRequest(text);
    if (cancellationIntent) {
      const cancellationReply = await handleCancellationIntent(ctx, tenant, fromPhone, text);
      await persistConversationTurn(tenantId, fromPhone, text, cancellationReply);
      await prisma.webhookLog.create({
        data: {
          tenantId,
          direction: 'OUT',
          toPhone: fromPhone,
          content: cancellationReply,
          status: 'PROCESSED',
        },
      });
      await updateLog(logRecord.id, 'PROCESSED');
      logger.info(ctx, 'Cancellation processed successfully');
      return;
    }

    // ── Step 5: Load conversation history ────────────────────────────────────
    const historyRows = await prisma.conversationHistory.findMany({
      where: { tenantId, customerPhone: fromPhone },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_PAIRS * 2,
    });
    const history = historyRows.reverse().map((r) => ({
      role: r.role,
      content: r.content,
    }));

    // ── Step 6: Build prompt ──────────────────────────────────────────────────
    const services = await prisma.service.findMany({
      where: { tenantId, active: true },
    });

    const availability = await buildAvailabilityWindow(tenantId, tenant, AVAILABILITY_DAYS);

    const messages = buildPrompt({
      tenant,
      services,
      availability,
      history,
      userMessage: text,
    });

    // ── Step 7: Call AI provider ──────────────────────────────────────────────
    const aiClient = getAIClient();
    let aiResponse;
    try {
      aiResponse = await aiClient.complete(messages);
    } catch (aiErr) {
      logger.error({ ...ctx, err: aiErr.message }, 'AI provider error — sending fallback');
      const fallback = 'Tu mensaje fue recibido. En breve te atiende una persona del local.';
      await sendWhatsAppMessage(tenant, fromPhone, fallback);
      await persistConversationTurn(tenantId, fromPhone, text, fallback);
      await updateLog(logRecord.id, 'PROCESSED');
      return;
    }

    // ── Step 8: Parse AI response ─────────────────────────────────────────────
    let replyText = aiResponse;
    let bookingHandled = false;

    // Try to detect booking intent (JSON response from AI)
    try {
      const parsed = JSON.parse(aiResponse);
      if (parsed?.intent === 'BOOK') {
        bookingHandled = true;
        replyText = await handleBookingIntent(ctx, tenant, parsed, fromPhone, text);
      } else if (parsed?.intent === 'HANDOFF') {
        bookingHandled = true;
        replyText = await handleHandoffIntent(ctx, tenant, parsed, fromPhone);
      }
    } catch {
      // Not JSON — treat as conversational reply (normal path)
    }

    if (!bookingHandled) {
      // ── Step 10: Send conversational reply ─────────────────────────────────
      await sendWhatsAppMessage(tenant, fromPhone, replyText);
    }

    // ── Step 11: Persist conversation history ─────────────────────────────────
    await persistConversationTurn(tenantId, fromPhone, text, replyText);

    // Log outbound message
    await prisma.webhookLog.create({
      data: {
        tenantId,
        direction: 'OUT',
        toPhone: fromPhone,
        content: replyText,
        status: 'PROCESSED',
      },
    });

    await updateLog(logRecord.id, 'PROCESSED');
    logger.info(ctx, 'Message processed successfully');

  } catch (err) {
    logger.error({ ...ctx, err: err.message, stack: err.stack }, 'Unhandled error processing message');
    await updateLog(logRecord.id, 'FAILED', err.message);
  }
}

// ── Booking intent handler ─────────────────────────────────────────────────
async function handleBookingIntent(ctx, tenant, parsed, fromPhone, userMessage) {
  const { service_id, slot, scheduled_date, customer_name } = parsed;
  const bookingDate = resolveBookingDate({
    scheduledDate: scheduled_date,
    userMessage,
    timezone: tenant.timezone,
  });

  try {
    const appointment = await bookAppointment({
      tenantId: tenant.id,
      serviceId: service_id,
      slot,
      scheduledDate: bookingDate,
      customerPhone: fromPhone,
      customerName: customer_name ?? 'Cliente',
      timeZone: tenant.timezone,
    });

    const service = await prisma.service.findUnique({ where: { id: service_id } });
    const dateStr = new Date(appointment.scheduledAt).toLocaleString('es-MX', {
      timeZone: tenant.timezone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    const confirmation =
      `Cita confirmada.\n\n` +
      `Servicio: ${service?.name}\n` +
      `Fecha: ${dateStr}\n` +
      `Nombre: ${customer_name ?? 'Cliente'}\n\n` +
      `Te esperamos en ${tenant.businessName}.`;

    await sendWhatsAppMessage(tenant, fromPhone, confirmation);
    return confirmation;

  } catch (err) {
    logger.warn({ ...ctx, err: err.message }, 'Booking failed');

    if (err.name === 'SlotUnavailableError') {
      const unavailMsg = 'Lo sentimos, ese horario ya no está disponible. ¿Te gustaría elegir otro horario?';
      await sendWhatsAppMessage(tenant, fromPhone, unavailMsg);
      return unavailMsg;
    }

    const errMsg = 'Hubo un problema al agendar tu cita. ¿Quieres que te proponga otro horario disponible?';
    await sendWhatsAppMessage(tenant, fromPhone, errMsg);
    return errMsg;
  }
}

async function handleHandoffIntent(ctx, tenant, parsed, fromPhone) {
  const message = typeof parsed?.message === 'string' && parsed.message.trim()
    ? parsed.message.trim()
    : 'En este momento voy a pasar tu solicitud con una persona del negocio para darle seguimiento.';

  await sendWhatsAppMessage(tenant, fromPhone, message);
  logger.info({ ...ctx, message }, 'Handoff response sent');
  return message;
}

async function handleCancellationIntent(ctx, tenant, fromPhone, userMessage) {
  const futureAppointments = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
      customerPhone: fromPhone,
      status: { in: ['CONFIRMED', 'PENDING'] },
      scheduledAt: { gte: new Date() },
    },
    include: { service: true },
    orderBy: { scheduledAt: 'asc' },
  });

  if (futureAppointments.length === 0) {
    const noAppointmentMsg = 'No encuentro una cita próxima para cancelar. Si gustas, dime la fecha y hora para revisar cuál quieres mover o cancelar.';
    await sendWhatsAppMessage(tenant, fromPhone, noAppointmentMsg);
    return noAppointmentMsg;
  }

  const requestedMatch = pickMatchingAppointment(futureAppointments, userMessage, tenant.timezone);
  const appointment = requestedMatch ?? futureAppointments[0];

  await updateAppointmentStatus(tenant.id, appointment.id, 'CANCELLED', 'Cancelada por WhatsApp');

  const dateStr = new Date(appointment.scheduledAt).toLocaleString('es-MX', {
    timeZone: tenant.timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const reply = `Listo, tu cita de ${appointment.service?.name ?? 'servicio'} para ${dateStr} quedó cancelada. Si quieres, te ayudo a agendar otra después.`;
  await sendWhatsAppMessage(tenant, fromPhone, reply);
  logger.info({ ...ctx, appointmentId: appointment.id }, 'Appointment cancelled');
  return reply;
}

async function updateLog(id, status, errorMsg) {
  await prisma.webhookLog.update({
    where: { id },
    data: { status, ...(errorMsg && { errorMsg }) },
  });
}

async function persistConversationTurn(tenantId, customerPhone, userContent, assistantContent) {
  await prisma.conversationHistory.createMany({
    data: [
      { tenantId, customerPhone, role: 'user', content: userContent },
      { tenantId, customerPhone, role: 'assistant', content: assistantContent },
    ],
  });
}

async function buildAvailabilityWindow(tenantId, tenant, daysCount) {
  const window = [];
  const todayLocal = getLocalDateString(new Date(), tenant.timezone ?? 'America/Mexico_City');

  for (let offset = 0; offset < daysCount; offset += 1) {
    const dateString = addDaysToDateString(todayLocal, offset);
    const date = buildDateFromLocalDateString(dateString, tenant.timezone ?? 'America/Mexico_City');
    const slots = await getAvailableSlots(tenantId, date, tenant.timezone);
    window.push({
      date: dateString,
      label: toHumanDate(date, tenant.timezone),
      slots,
    });
  }

  return window;
}

function resolveBookingDate({ scheduledDate, userMessage, timezone }) {
  if (typeof scheduledDate === 'string' && scheduledDate.trim()) {
    return scheduledDate.trim();
  }

  const text = (userMessage ?? '').toLowerCase();
  const todayLocal = getLocalDateString(new Date(), timezone ?? 'America/Mexico_City');
  if (text.includes('pasado mañana')) return addDaysToDateString(todayLocal, 2);
  if (text.includes('mañana')) return addDaysToDateString(todayLocal, 1);
  return todayLocal;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toHumanDate(date, timezone) {
  return date.toLocaleDateString('es-MX', {
    timeZone: timezone ?? 'America/Mexico_City',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getLocalDateString(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone ?? 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDaysToDateString(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day);
  return new Date(utc + days * 86400000).toISOString().slice(0, 10);
}

function buildDateFromLocalDateString(dateString, timeZone) {
  return buildZonedDate(dateString, '12:00', timeZone ?? 'America/Mexico_City');
}

function buildZonedDate(dateString, timeString, timeZone) {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const guessedDate = new Date(utcGuess);
  const offset = getTimeZoneOffsetMs(guessedDate, timeZone);
  return new Date(utcGuess - offset);
}

function getTimeZoneOffsetMs(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtc - date.getTime();
}

function pickMatchingAppointment(appointments, userMessage, timeZone) {
  const text = (userMessage ?? '').toLowerCase();
  const requestedDate = extractRequestedDate(text, timeZone);
  const requestedTime = extractRequestedTime(text);

  return appointments.find((appointment) => {
    const appointmentDate = getLocalDateString(new Date(appointment.scheduledAt), timeZone);
    if (requestedDate && appointmentDate !== requestedDate) return false;

    if (!requestedTime) return true;
    const appointmentTime = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(appointment.scheduledAt));
    return appointmentTime === requestedTime;
  });
}

function extractRequestedDate(text, timeZone) {
  const normalized = (text ?? '').toLowerCase();
  if (normalized.includes('pasado mañana')) return addDaysToDateString(getLocalDateString(new Date(), timeZone), 2);
  if (normalized.includes('mañana')) return addDaysToDateString(getLocalDateString(new Date(), timeZone), 1);
  if (normalized.includes('hoy')) return getLocalDateString(new Date(), timeZone);
  return null;
}

function extractRequestedTime(text) {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = (match[3] ?? '').toLowerCase();

  if (meridiem.includes('p') && hours < 12) hours += 12;
  if (meridiem.includes('a') && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function isCancellationRequest(text) {
  const normalized = (text ?? '').toLowerCase();
  if (normalized.includes('no voy a poder')) return true;
  if (normalized.includes('no podre')) return true;
  if (normalized.includes('no podré')) return true;
  if (normalized.includes('cancel')) return true;
  if (normalized.includes('reagend')) return true;
  if (normalized.includes('mover mi cita')) return true;
  if (normalized.includes('cambiar mi cita')) return true;
  return false;
}
