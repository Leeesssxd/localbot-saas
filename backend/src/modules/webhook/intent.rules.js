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

export function isBookingContinuation(text) {
  const normalized = normalizeText(text);
  if (!normalized) return false;

  if (extractRequestedTime(text)) return true;
  if (extractRequestedDate(text, 'America/Mexico_City', () => '', () => '')) return true;

  return (
    /^(si|claro|perfecto|va|sale|dale|me sirve|me queda|esa hora|ese horario|a esa hora|para hoy|para manana|para pasado manana)\b/.test(normalized)
    || /^a las\s+\d{1,2}/.test(normalized)
  );
}

export function isConversationResetRequest(text) {
  const normalized = normalizeText(text);
  return (
    normalized.includes('reiniciar el chat')
    || normalized.includes('reinicia el chat')
    || normalized.includes('empezar de nuevo')
    || normalized.includes('comenzar de nuevo')
    || normalized.includes('resetear el chat')
  );
}

export function isCasualAcknowledgement(text) {
  const normalized = normalizeText(text);
  return [
    'hola',
    'gracias',
    'muchas gracias',
    'ok',
    'okey',
    'okay',
    'vale',
    'va',
    'sale',
    'jaja',
    'jajaja',
    'jajajaja',
    'jeje',
    'de nada',
  ].includes(normalized);
}

export function isNegativeResponse(text) {
  const normalized = normalizeText(text);
  return (
    normalized.includes('no gracias')
    || normalized === 'no'
    || normalized.includes('ya no')
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

  const absoluteDate = extractAbsoluteDate(normalized, today);
  if (absoluteDate) return absoluteDate;
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
  const absoluteDate = extractAbsoluteDate(text, todayLocal);
  if (absoluteDate) return absoluteDate;
  return todayLocal;
}

function extractAbsoluteDate(normalizedText, today) {
  const monthMap = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    setiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
  };

  const namedMatch = normalizedText.match(/\b(\d{1,2})\s+de\s+([a-z]+)\b|\b(\d{1,2})\s+([a-z]+)\b/);
  if (namedMatch) {
    const day = Number(namedMatch[1] ?? namedMatch[3]);
    const monthName = namedMatch[2] ?? namedMatch[4];
    const month = monthMap[monthName];
    if (month) {
      const [year] = today.split('-').map(Number);
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const numericMatch = normalizedText.match(/\b(\d{1,2})[\/\-](\d{1,2})\b/);
  if (numericMatch) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]);
    const [year] = today.split('-').map(Number);
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return null;
}
