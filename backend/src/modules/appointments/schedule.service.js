// modules/appointments/schedule.service.js
// Calculates available time slots for a given tenant and date.
// Core logic: generate all 30-min slots within opening hours, then subtract confirmed appointments.

import prisma from '../../shared/db.js';

/**
 * Returns available time slots for a given date.
 *
 * @param {string} tenantId
 * @param {Date}   date       – The date to check
 * @param {string} [timeZone] – Tenant IANA timezone
 * @returns {string[]}        – Array of available slot times in "HH:MM" format
 */
export async function getAvailableSlots(tenantId, date, timeZone = 'America/Mexico_City') {
  const dayOfWeek = getDayOfWeekInTimeZone(date, timeZone);

  const template = await prisma.scheduleTemplate.findUnique({
    where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } },
  });

  if (!template || !template.isOpen) return [];

  // Generate all 30-minute slots between openTime and closeTime
  const allSlots = generateSlots(template.openTime, template.closeTime);

  // Find confirmed appointments for this date
  const { dayStart, dayEnd } = getUtcRangeForLocalDate(date, timeZone);

  const confirmed = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      scheduledAt: { gte: dayStart, lte: dayEnd },
    },
    include: { service: true },
  });

  // Filter out slots that overlap with existing appointments
  const available = allSlots.filter((slot) => {
    const slotStart = parseSlotToMinutes(slot);
    // Assume default 30 min if we can't determine — prompt will show service-specific duration
    const slotEnd = slotStart + 30;

    return !confirmed.some((appt) => {
      const apptStart = dateToMinutesInDayInTimeZone(new Date(appt.scheduledAt), timeZone);
      const apptEnd = dateToMinutesInDayInTimeZone(new Date(appt.endsAt), timeZone);
      // Overlapping: slot starts before appt ends AND slot ends after appt starts
      return slotStart < apptEnd && slotEnd > apptStart;
    });
  });

  return available;
}

function generateSlots(openTime, closeTime) {
  const slots = [];
  let current = parseSlotToMinutes(openTime);
  const end = parseSlotToMinutes(closeTime);

  while (current + 30 <= end) {
    slots.push(minutesToTimeString(current));
    current += 30;
  }

  return slots;
}

function parseSlotToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeString(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function dateToMinutesInDayInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return Number(parts.hour) * 60 + Number(parts.minute);
}

function getDayOfWeekInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const map = { Sun: 7, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 1;
}

function getUtcRangeForLocalDate(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const localDateString = `${parts.year}-${parts.month}-${parts.day}`;
  const start = buildZonedDate(localDateString, '00:00', timeZone);
  const end = buildZonedDate(localDateString, '23:59', timeZone);

  return { dayStart: start, dayEnd: end };
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
