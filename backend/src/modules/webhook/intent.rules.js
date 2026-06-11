export function normalizeText(text) {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isCancellationRequest(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('no voy a poder')) return true;
  if (normalized.includes('no podre')) return true;
  if (normalized.includes('cancel')) return true;
  if (normalized.includes('anular')) return true;
  return false;
}

export function isRescheduleRequest(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('reagend')) return true;
  if (normalized.includes('reprogram')) return true;
  if (normalized.includes('pospon')) return true;
  if (normalized.includes('mover')) return true;
  if (normalized.includes('mover mi cita')) return true;
  if (normalized.includes('cambiar mi cita')) return true;
  if (normalized.includes('cambiarla')) return true;
  if (normalized.includes('moverla')) return true;
  if (normalized.includes('pasarla')) return true;
  return false;
}

export function looksLikeBookingRequest(text) {
  const normalized = normalizeText(text);
  return (
    normalized.includes('agend')
    || normalized.includes('reserv')
    || normalized.includes('cita')
    || normalized.includes('quiero')
    || normalized.includes('necesito')
    || normalized.includes('disponibil')
  );
}

export function extractRequestedTime(text) {
  const match = (text ?? '').match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = (match[3] ?? '').toLowerCase();

  if (meridiem.includes('p') && hours < 12) hours += 12;
  if (meridiem.includes('a') && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function extractRequestedDate(text, timeZone, getLocalDateString, addDaysToDateString) {
  const normalized = normalizeText(text);
  const today = getLocalDateString(new Date(), timeZone);
  if (normalized.includes('pasado manana')) return addDaysToDateString(today, 2);
  if (normalized.includes('manana')) return addDaysToDateString(today, 1);
  if (normalized.includes('hoy')) return today;
  return null;
}

export function resolveBookingDate({ scheduledDate, userMessage, timezone, getLocalDateString, addDaysToDateString }) {
  if (typeof scheduledDate === 'string' && scheduledDate.trim()) {
    return scheduledDate.trim();
  }

  const text = normalizeText(userMessage);
  const todayLocal = getLocalDateString(new Date(), timezone ?? 'America/Mexico_City');
  if (text.includes('pasado manana')) return addDaysToDateString(todayLocal, 2);
  if (text.includes('manana')) return addDaysToDateString(todayLocal, 1);
  return todayLocal;
}
