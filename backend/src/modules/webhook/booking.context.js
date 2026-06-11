import {
  extractRequestedDate,
  extractRequestedTime,
  isCasualAcknowledgement,
  isConversationResetRequest,
  isNegativeResponse,
  looksLikeBookingRequest,
  normalizeText,
} from './intent.rules.js';
import { findMatchingService } from './service.matching.js';

const BOOKING_CONTEXT_RE = /(agend|reserv|cita|disponibil|horario|hora|mover|reagend|reprogram)/i;
const MAX_CONTEXT_ROWS = 8;

export function inferBookingContext(historyRows, services, timezone) {
  const rows = Array.isArray(historyRows) ? historyRows.slice(0, MAX_CONTEXT_ROWS) : [];
  const context = {
    service: null,
    date: null,
    time: null,
    active: false,
  };

  let inBookingThread = false;

  for (const row of rows) {
    const content = row?.content ?? '';
    const normalized = normalizeText(content);

    if (
      row?.role === 'user'
      && !inBookingThread
      && (isConversationResetRequest(content) || isCasualAcknowledgement(content) || isNegativeResponse(content))
    ) {
      break;
    }

    const hasBookingSignal =
      looksLikeBookingRequest(content)
      || BOOKING_CONTEXT_RE.test(normalized)
      || findMatchingService(normalized, services);

    if (hasBookingSignal) {
      inBookingThread = true;
      context.active = true;
    }

    if (!inBookingThread) {
      continue;
    }

    if (!context.service) {
      const matchedService = findMatchingService(normalized, services);
      if (matchedService) {
        context.service = matchedService;
      }
    }

    if (!context.date) {
      const requestedDate = extractRequestedDate(
        content,
        timezone,
        getLocalDateString,
        addDaysToDateString
      );
      if (requestedDate) {
        context.date = requestedDate;
      }
    }

    if (!context.time) {
      const requestedTime = extractRequestedTime(content);
      if (requestedTime) {
        context.time = requestedTime;
      }
    }

    if (context.service && context.date && context.time) {
      break;
    }
  }

  return context;
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
