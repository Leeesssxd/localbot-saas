// modules/webhook/webhook.service.js
// Orchestrates the full lifecycle of an inbound WhatsApp message.
// Follows the 11-step flow defined in README § 3 "Ciclo de Vida Completo".

import prisma from '../../shared/db.js';
import logger from '../../shared/logger.js';
import { extractMessageData } from './webhook.validator.js';
import { getAIClient } from '../ai/ai.client.js';
import { buildPrompt } from '../ai/prompt.builder.js';
import { sendWhatsAppMessage } from '../whatsapp/whatsapp.client.js';
import { bookAppointment, updateAppointmentStatus, rescheduleAppointment } from '../appointments/appointments.service.js';
import { getAvailableSlots } from '../appointments/schedule.service.js';
import {
  extractRequestedDate,
  extractRequestedTime,
  isBookingContinuation,
  isCasualAcknowledgement,
  isCancellationRequest,
  isConversationResetRequest,
  isNegativeResponse,
  isRescheduleRequest,
  looksLikeBookingRequest,
  normalizeText,
  resolveBookingDate,
} from './intent.rules.js';
import {
  buildUnavailableSlotMessage,
  resolveRescheduleDateTime,
} from './slot.suggestions.js';
import { findMatchingService } from './service.matching.js';
import { inferBookingContext } from './booking.context.js';

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

    const rescheduleIntent = isRescheduleRequest(text);
    if (rescheduleIntent) {
      const rescheduleReply = await handleRescheduleIntent(ctx, tenant, fromPhone, text);
      await persistConversationTurn(tenantId, fromPhone, text, rescheduleReply);
      await prisma.webhookLog.create({
        data: {
          tenantId,
          direction: 'OUT',
          toPhone: fromPhone,
          content: rescheduleReply,
          status: 'PROCESSED',
        },
      });
      await updateLog(logRecord.id, 'PROCESSED');
      logger.info(ctx, 'Reschedule processed successfully');
      return;
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
    const bookingContext = inferBookingContext(historyRows, services, tenant.timezone);

    const directBooking = resolveDirectBookingIntent({
      text,
      services,
      availability,
      timezone: tenant.timezone,
      bookingContext,
    });

    if (directBooking) {
      const replyText = await handleBookingIntent(
        ctx,
        tenant,
        directBooking,
        fromPhone,
        text,
        availability
      );

      await persistConversationTurn(tenantId, fromPhone, text, replyText);
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
      logger.info(ctx, 'Direct booking resolved without AI');
      return;
    }

    const bookingClarification = buildBookingClarification({
      text,
      services,
      availability,
      timezone: tenant.timezone,
      bookingContext,
    });

    if (bookingClarification) {
      await sendWhatsAppMessage(tenant, fromPhone, bookingClarification);
      await persistConversationTurn(tenantId, fromPhone, text, bookingClarification);
      await prisma.webhookLog.create({
        data: {
          tenantId,
          direction: 'OUT',
          toPhone: fromPhone,
          content: bookingClarification,
          status: 'PROCESSED',
        },
      });

      await updateLog(logRecord.id, 'PROCESSED');
      logger.info(ctx, 'Booking clarification sent without AI');
      return;
    }

    const messages = buildPrompt({
      tenant,
      services,
      availability,
      history,
      bookingContext,
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
    const parsed = parseStructuredIntent(aiResponse);
    if (parsed) {
      if (parsed?.intent === 'BOOK') {
        const normalizedBooking = normalizeStructuredBookingIntent({
          parsed,
          text,
          services,
          timezone: tenant.timezone,
          bookingContext,
        });

        if (normalizedBooking) {
          bookingHandled = true;
          replyText = await handleBookingIntent(ctx, tenant, normalizedBooking, fromPhone, text, availability);
        }
      } else if (parsed?.intent === 'HANDOFF') {
        bookingHandled = true;
        replyText = await handleHandoffIntent(ctx, tenant, parsed, fromPhone);
      }
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
async function handleBookingIntent(ctx, tenant, parsed, fromPhone, userMessage, availability = []) {
  const { service_id, slot, scheduled_date, customer_name } = parsed;

  if (!service_id || !slot) {
    const missingMessage = 'Para agendar necesito saber qué servicio quieres y a qué hora te queda mejor.';
    await sendWhatsAppMessage(tenant, fromPhone, missingMessage);
    return missingMessage;
  }

  const bookingDate = resolveBookingDate({
    scheduledDate: scheduled_date,
    userMessage,
    timezone: tenant.timezone,
    getLocalDateString,
    addDaysToDateString,
  });

  const customerName = sanitizeCustomerName(customer_name) ?? 'Cliente';

  try {
    const appointment = await bookAppointment({
      tenantId: tenant.id,
      serviceId: service_id,
      slot,
      scheduledDate: bookingDate,
      customerPhone: fromPhone,
      customerName,
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
      `Fecha: ${dateStr}` +
      (isMeaningfulCustomerName(customerName) ? `\nNombre: ${customerName}` : '') +
      `\n\n` +
      `Te esperamos en ${tenant.businessName}.`;

    await sendWhatsAppMessage(tenant, fromPhone, confirmation);
    return confirmation;

  } catch (err) {
    logger.warn({ ...ctx, err: err.message }, 'Booking failed');

    if (err.name === 'SlotUnavailableError') {
      const unavailMsg = buildUnavailableSlotMessage({
        tenant,
        availability,
        requestedDate: bookingDate,
        requestedTime: slot,
      });
      await sendWhatsAppMessage(tenant, fromPhone, unavailMsg);
      return unavailMsg;
    }

    if (err.name === 'PastDateError') {
      const errMsg = 'Ese horario ya pasó. Si quieres, dime otra hora de hoy o te propongo opciones disponibles.';
      await sendWhatsAppMessage(tenant, fromPhone, errMsg);
      return errMsg;
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
  const normalized = normalizeText(userMessage);
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

  if (normalized.includes('cancela todo') || normalized.includes('cancelar todo')) {
    await Promise.all(
      futureAppointments.map((appointment) =>
        updateAppointmentStatus(tenant.id, appointment.id, 'CANCELLED', 'Cancelada por WhatsApp')
      )
    );

    const reply = futureAppointments.length === 1
      ? 'Listo, cancelé tu cita pendiente. Si luego quieres reagendar, te ayudo con gusto.'
      : `Listo, cancelé tus ${futureAppointments.length} citas pendientes. Si luego quieres reagendar alguna, te ayudo con gusto.`;
    await sendWhatsAppMessage(tenant, fromPhone, reply);
    return reply;
  }

  const selection = selectAppointmentForMessage(futureAppointments, userMessage, tenant.timezone);
  if (selection.matches.length > 1) {
    const askWhich = 'Encontré más de una cita que coincide. Dime por favor la fecha u hora exacta de la que quieres cancelar.';
    await sendWhatsAppMessage(tenant, fromPhone, askWhich);
    return askWhich;
  }

  if (selection.hasExplicitFilter && !selection.match) {
    const notFound = 'No encontré una cita futura que coincida con esa fecha u hora. Si quieres, dime el día exacto y la revisamos juntos.';
    await sendWhatsAppMessage(tenant, fromPhone, notFound);
    return notFound;
  }

  if (!selection.match && futureAppointments.length > 1) {
    const askWhich = 'Tienes más de una cita activa. Dime por favor la fecha u hora exacta de la que quieres cancelar.';
    await sendWhatsAppMessage(tenant, fromPhone, askWhich);
    return askWhich;
  }

  const appointment = selection.match ?? futureAppointments[0];

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

async function handleRescheduleIntent(ctx, tenant, fromPhone, userMessage) {
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
    const noAppointmentMsg = 'No encuentro una cita próxima para mover. Si gustas, dime qué fecha y hora quieres para ayudarte a agendar otra.';
    await sendWhatsAppMessage(tenant, fromPhone, noAppointmentMsg);
    return noAppointmentMsg;
  }

  const selection = selectAppointmentForMessage(futureAppointments, userMessage, tenant.timezone);
  if (selection.matches.length > 1) {
    const askWhich = 'Encontré más de una cita que coincide. Dime por favor la fecha u hora exacta de la que quieres mover.';
    await sendWhatsAppMessage(tenant, fromPhone, askWhich);
    return askWhich;
  }

  if (selection.hasExplicitFilter && !selection.match) {
    const notFound = 'No encontré una cita futura que coincida con esa fecha u hora. Si quieres, dime el día exacto y la revisamos juntos.';
    await sendWhatsAppMessage(tenant, fromPhone, notFound);
    return notFound;
  }

  if (!selection.match && futureAppointments.length > 1) {
    const askWhich = 'Tienes más de una cita activa. Dime por favor la fecha u hora exacta de la que quieres mover.';
    await sendWhatsAppMessage(tenant, fromPhone, askWhich);
    return askWhich;
  }

  const appointment = selection.match ?? futureAppointments[0];
  const targetDateTime = resolveRescheduleDateTime(userMessage, tenant.timezone, appointment);

  if (!targetDateTime) {
    const askForTime = `Claro, puedo mover tu cita de ${appointment.service?.name ?? 'servicio'}. ¿Para qué día y hora te gustaría reprogramarla?`;
    await sendWhatsAppMessage(tenant, fromPhone, askForTime);
    return askForTime;
  }

  try {
    const updated = await rescheduleAppointment({
      tenantId: tenant.id,
      appointmentId: appointment.id,
      scheduledAt: targetDateTime.toISOString(),
      notes: 'Reagendada por WhatsApp',
    });

    const dateStr = new Date(updated.scheduledAt).toLocaleString('es-MX', {
      timeZone: tenant.timezone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    const reply = `Listo, moví tu cita de ${updated.service?.name ?? 'servicio'} para ${dateStr}. Si necesitas otro ajuste, dime y te ayudo.`;
    await sendWhatsAppMessage(tenant, fromPhone, reply);
    logger.info({ ...ctx, appointmentId: updated.id, scheduledAt: updated.scheduledAt }, 'Appointment rescheduled');
    return reply;
  } catch (err) {
    logger.warn({ ...ctx, err: err.message }, 'Reschedule failed');

    if (err.name === 'SlotUnavailableError') {
      const alternatives = await buildAvailabilityWindow(tenant.id, tenant, AVAILABILITY_DAYS);
      const unavailMsg = buildUnavailableSlotMessage({
        tenant,
        userMessage,
        availability: alternatives,
        requestedDate: targetDateTime ? getLocalDateString(targetDateTime, tenant.timezone) : null,
        requestedTime: targetDateTime ? formatTimeInTimeZone(targetDateTime, tenant.timezone) : null,
        reschedule: true,
      });
      await sendWhatsAppMessage(tenant, fromPhone, unavailMsg);
      return unavailMsg;
    }

    const errMsg = 'Hubo un problema al mover tu cita. ¿Quieres que te proponga otro horario disponible?';
    await sendWhatsAppMessage(tenant, fromPhone, errMsg);
    return errMsg;
  }
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

function selectAppointmentForMessage(appointments, userMessage, timeZone) {
  const text = userMessage ?? '';
  const normalized = normalizeText(text);
  const requestedDate = extractRequestedDate(text, timeZone, getLocalDateString, addDaysToDateString);
  const requestedTime = extractRequestedTime(text);
  const hasExplicitFilter = Boolean(requestedDate || requestedTime);

  const matches = appointments.filter((appointment) => {
    const appointmentDate = getLocalDateString(new Date(appointment.scheduledAt), timeZone);
    if (requestedDate && appointmentDate !== requestedDate) return false;

    if (requestedTime) {
      const appointmentTime = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(new Date(appointment.scheduledAt));

      if (appointmentTime !== requestedTime) return false;
    }

    return true;
  });

  return {
    hasExplicitFilter,
    matches,
    match: matches.length === 1 ? matches[0] : null,
  };
}

export function resolveDirectBookingIntent({ text, services, availability, timezone, bookingContext }) {
  const signals = inferBookingSignals({ text, services, timezone, bookingContext });
  if (!signals.allowBooking) return null;
  if (!signals.service || !signals.slot) return null;

  const dayAvailability = availability.find((day) => day.date === signals.scheduledDate);
  if (dayAvailability && !dayAvailability.slots.includes(signals.slot)) {
    return null;
  }
  if (!signals.scheduledDate) return null;

  return {
    intent: 'BOOK',
    service_id: signals.service.id,
    scheduled_date: signals.scheduledDate,
    slot: signals.slot,
    customer_name: extractCustomerName(text),
  };
}

export function buildBookingClarification({ text, services, availability, timezone, bookingContext }) {
  const signals = inferBookingSignals({ text, services, timezone, bookingContext });
  if (!signals.allowBooking) return null;

  const requestedDate = signals.scheduledDate;
  const requestedTime = signals.slot;
  const service = signals.service;

  if (requestedTime) {
    if (requestedDate) {
      const dayAvailability = availability.find((day) => day.date === requestedDate);
      if (dayAvailability?.slots?.includes(requestedTime)) {
        return null;
      }

      const preview = previewAvailability(dayAvailability?.slots ?? [], requestedTime);
      if (preview) {
        return `Claro, para ${service?.name ?? 'ese servicio'} ${describeRelativeDate(requestedDate, timezone)} tengo estos horarios cercanos: ${preview}. ¿Cuál te queda mejor?`;
      }
    }

    return `Claro, para ${service?.name ?? 'agendar tu cita'} te ayudo con gusto. ¿Te queda bien esa hora o prefieres otro horario?`;
  }

  if (service && requestedDate) {
    return `Perfecto, para ${service.name} ${describeRelativeDate(requestedDate, timezone)}. ¿Qué hora te gustaría?`;
  }

  if (service) {
    return `Claro, te ayudo con ${service.name}. ¿Para qué día y hora te gustaría agendarla?`;
  }

  if (requestedDate) {
    return `Claro, te ayudo a agendar ${describeRelativeDate(requestedDate, timezone)}. ¿Qué servicio necesitas y a qué hora te queda mejor?`;
  }

  return 'Claro, te ayudo a agendar. ¿Qué servicio necesitas y a qué hora te queda mejor?';
}

function inferBookingSignals({ text, services, timezone, bookingContext }) {
  const normalized = normalizeText(text);
  const explicitService = findMatchingService(normalized, services);
  const explicitDate = extractRequestedDate(text, timezone, getLocalDateString, addDaysToDateString);
  const explicitTime = extractRequestedTime(text);
  const hasContext = Boolean(bookingContext?.active && (bookingContext?.service || bookingContext?.date || bookingContext?.time));
  const continuation = hasContext && isBookingContinuation(text);
  const directBookingSignal =
    looksLikeBookingRequest(normalized)
    || Boolean(explicitService)
    || Boolean(explicitDate)
    || Boolean(explicitTime);

  if (
    isConversationResetRequest(text)
    || isCasualAcknowledgement(text)
    || isNegativeResponse(text)
  ) {
    return { allowBooking: false };
  }

  const allowBooking = directBookingSignal || continuation;
  if (!allowBooking) {
    return { allowBooking: false };
  }

  return {
    allowBooking,
    service: explicitService ?? bookingContext?.service ?? null,
    slot: explicitTime ?? bookingContext?.time ?? null,
    scheduledDate: explicitDate ?? bookingContext?.date ?? null,
  };
}

function normalizeStructuredBookingIntent({ parsed, text, services, timezone, bookingContext }) {
  const signals = inferBookingSignals({ text, services, timezone, bookingContext });
  if (!signals.allowBooking || !signals.service) return null;

  const expectedTime = signals.slot;
  const expectedDate = signals.scheduledDate
    ?? (typeof parsed?.scheduled_date === 'string' ? parsed.scheduled_date.trim() : '')
    ?? null;
  const parsedSlot = typeof parsed?.slot === 'string' ? parsed.slot.trim() : '';
  const parsedDate = typeof parsed?.scheduled_date === 'string' ? parsed.scheduled_date.trim() : '';

  if (expectedTime && parsedSlot && parsedSlot !== expectedTime) return null;
  if (expectedDate && parsedDate && parsedDate !== expectedDate) return null;

  const slot = expectedTime ?? parsedSlot;
  if (!slot || !expectedDate) return null;

  return {
    intent: 'BOOK',
    service_id: signals.service.id,
    scheduled_date: expectedDate,
    slot,
    customer_name: extractCustomerName(text) ?? sanitizeCustomerName(parsed?.customer_name),
  };
}

function previewAvailability(slots, requestedTime = null) {
  if (!Array.isArray(slots) || slots.length === 0) return '';

  const sorted = [...slots].sort((a, b) => a.localeCompare(b));
  if (!requestedTime) {
    return sorted.slice(0, 3).join(', ');
  }

  const requestedMinutes = timeStringToMinutes(requestedTime);
  return sorted
    .map((slot) => ({
      slot,
      diff: Math.abs(timeStringToMinutes(slot) - requestedMinutes),
    }))
    .sort((a, b) => a.diff - b.diff || a.slot.localeCompare(b.slot))
    .slice(0, 3)
    .map((item) => item.slot)
    .join(', ');
}

function describeRelativeDate(dateString, timezone) {
  const today = getLocalDateString(new Date(), timezone ?? 'America/Mexico_City');
  if (dateString === today) return 'hoy';
  if (dateString === addDaysToDateString(today, 1)) return 'mañana';
  if (dateString === addDaysToDateString(today, 2)) return 'pasado mañana';

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('es-MX', {
    timeZone: timezone ?? 'America/Mexico_City',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function timeStringToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

export function extractCustomerName(text) {
  const source = (text ?? '').trim();
  const patterns = [
    /(?:me llamo|mi nombre es|soy|a nombre de|nombre:)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\- ]{2,40})/i,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) {
      return sanitizeCustomerName(match[1]);
    }
  }

  return null;
}

function sanitizeCustomerName(name) {
  const candidate = String(name ?? '').trim().replace(/\s+/g, ' ');
  if (!candidate) return null;
  if (/\d/.test(candidate)) return null;

  const normalized = normalizeText(candidate);
  const bannedFragments = [
    'cliente',
    'hoy',
    'manana',
    'pasado manana',
    'a las',
    'cita',
    'corte',
    'quiero',
    'agendar',
    'normal',
  ];

  if (bannedFragments.some((fragment) => normalized.includes(fragment))) {
    return null;
  }

  return candidate;
}

function isMeaningfulCustomerName(name) {
  return Boolean(sanitizeCustomerName(name));
}

function parseStructuredIntent(aiResponse) {
  if (typeof aiResponse !== 'string') return null;

  const stripped = aiResponse
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const attempts = [stripped];
  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    attempts.push(stripped.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && parsed.intent) return parsed;
    } catch {
      // keep trying
    }
  }

  return null;
}

function formatTimeInTimeZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone ?? 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}
