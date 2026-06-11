import {
  extractRequestedDate,
  extractRequestedTime,
} from './intent.rules.js';

export function buildUnavailableSlotMessage({
  tenant,
  availability,
  requestedDate,
  requestedTime,
  reschedule = false,
}) {
  const alternatives = collectAlternativeSlots({
    availability,
    requestedDate,
    requestedTime,
    timezone: tenant.timezone,
  });

  const intro = reschedule
    ? 'Ese horario ya está ocupado.'
    : 'Lo sentimos, ese horario ya no está disponible.';

  if (alternatives.length === 0) {
    return `${intro} Si quieres, dime otra fecha u hora y te ayudo a buscar un espacio.`;
  }

  const suggestions = alternatives
    .slice(0, 3)
    .map((item) => `${item.label} a las ${item.time}`)
    .join(', ');

  return `${intro} Te puedo ofrecer estas opciones: ${suggestions}. ¿Cuál te queda mejor?`;
}

export function collectAlternativeSlots({ availability, requestedDate, requestedTime }) {
  const normalizedDate = typeof requestedDate === 'string' ? requestedDate : null;
  const requestedMinutes = requestedTime ? timeStringToMinutes(requestedTime) : null;
  const sortedAvailability = [...(availability ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  const sameDay = normalizedDate
    ? sortedAvailability.find((day) => day.date === normalizedDate)
    : null;

  const candidates = [];
  if (sameDay?.slots?.length) {
    candidates.push(...sameDay.slots.map((slot) => ({
      date: sameDay.date,
      label: sameDay.label,
      time: slot,
      score: requestedMinutes == null ? 0 : Math.abs(timeStringToMinutes(slot) - requestedMinutes),
    })));
  }

  if (candidates.length < 3) {
    for (const day of sortedAvailability) {
      if (normalizedDate && day.date === normalizedDate) continue;
      for (const slot of day.slots ?? []) {
        candidates.push({
          date: day.date,
          label: day.label,
          time: slot,
          score: requestedMinutes == null
            ? 1000
            : Math.abs(timeStringToMinutes(slot) - requestedMinutes) + (normalizedDate && day.date > normalizedDate ? 15 : 45),
        });
      }
    }
  }

  const seen = new Set();
  return candidates
    .sort((a, b) => a.score - b.score || a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .filter((item) => {
      const key = `${item.date}-${item.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function resolveRescheduleDateTime(userMessage, timeZone, appointment) {
  const text = (userMessage ?? '').toLowerCase();
  const requestedDate = extractRequestedDate(
    text,
    timeZone,
    getLocalDateString,
    addDaysToDateString
  ) ?? (appointment ? getLocalDateString(new Date(appointment.scheduledAt), timeZone) : null);
  const requestedTime = extractRequestedTime(text);

  if (!requestedDate || !requestedTime) return null;
  return buildZonedDate(requestedDate, requestedTime, timeZone ?? 'America/Mexico_City');
}

function timeStringToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
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
