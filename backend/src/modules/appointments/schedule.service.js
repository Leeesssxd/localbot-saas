// modules/appointments/schedule.service.js
// Calculates available time slots for a given tenant and date.
// Core logic: generate all 30-min slots within opening hours, then subtract confirmed appointments.

import prisma from '../../shared/db.js';

/**
 * Returns available time slots for a given date.
 *
 * @param {string} tenantId
 * @param {Date}   date       – The date to check
 * @returns {string[]}        – Array of available slot times in "HH:MM" format
 */
export async function getAvailableSlots(tenantId, date) {
  // Get day of week (1=Mon, 7=Sun) — JS Sunday=0 needs remapping
  const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  const template = await prisma.scheduleTemplate.findUnique({
    where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } },
  });

  if (!template || !template.isOpen) return [];

  // Generate all 30-minute slots between openTime and closeTime
  const allSlots = generateSlots(template.openTime, template.closeTime);

  // Find confirmed appointments for this date
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

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
      const apptStart = dateToMinutesInDay(new Date(appt.scheduledAt));
      const apptEnd = dateToMinutesInDay(new Date(appt.endsAt));
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

function dateToMinutesInDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}
