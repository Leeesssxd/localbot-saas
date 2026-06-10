// modules/appointments/appointments.service.js
// Business logic for creating and managing appointments.
// The no-overlap guarantee lives in PostgreSQL (EXCLUDE constraint).

import prisma from '../../shared/db.js';
import { SlotUnavailableError, NotFoundError, ForbiddenError } from '../../shared/errors.js';
import logger from '../../shared/logger.js';

/**
 * Books an appointment.
 * Handles the SlotUnavailableError from PostgreSQL's EXCLUDE constraint.
 */
export async function bookAppointment({ tenantId, serviceId, slot, scheduledDate, customerPhone, customerName, timeZone }) {
  // Validate service belongs to this tenant and is active
  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId, active: true },
  });

  if (!service) {
    throw new NotFoundError('Service');
  }

  // Parse slot (HH:MM) into the requested tenant-local date and convert to UTC.
  const [hours, minutes] = slot.split(':').map(Number);
  const scheduledAt = buildZonedDate({
    date: scheduledDate ?? new Date().toISOString().slice(0, 10),
    hours,
    minutes,
    timeZone,
  });

  const endsAt = new Date(scheduledAt.getTime() + service.durationMin * 60 * 1000);

  try {
    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        serviceId,
        customerPhone,
        customerName,
        scheduledAt,
        endsAt,
        status: 'CONFIRMED',
      },
    });

    logger.info(
      { tenantId, appointmentId: appointment.id, slot, serviceId },
      'Appointment booked successfully'
    );

    return appointment;

  } catch (err) {
    // PostgreSQL EXCLUDE constraint violation
    // Error code P2002 is Prisma's unique constraint; raw Postgres throws code 23P01 for EXCLUDE
    if (
      err.code === 'P2002' ||
      err.message?.includes('no_overlap') ||
      err.message?.includes('exclusion constraint')
    ) {
      throw new SlotUnavailableError(slot);
    }
    throw err;
  }
}

/**
 * Lists appointments for a tenant within a date range.
 */
export async function listAppointments(tenantId, from, to) {
  return prisma.appointment.findMany({
    where: {
      tenantId,
      scheduledAt: {
        gte: from,
        lte: to,
      },
    },
    include: { service: true },
    orderBy: { scheduledAt: 'asc' },
  });
}

/**
 * Updates an appointment's status (CANCELLED, NO_SHOW, etc.)
 * Verifies ownership before update.
 */
export async function updateAppointmentStatus(tenantId, appointmentId, status, notes) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) throw new NotFoundError('Appointment');
  if (appointment.tenantId !== tenantId) throw new ForbiddenError();

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status, ...(notes !== undefined && { notes }) },
    include: { service: true },
  });
}

/**
 * Creates a manual appointment from the dashboard.
 */
export async function createManualAppointment({ tenantId, serviceId, customerPhone, customerName, scheduledAt }) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId, active: true },
  });

  if (!service) throw new NotFoundError('Service');

  const endsAt = new Date(new Date(scheduledAt).getTime() + service.durationMin * 60 * 1000);

  try {
    return await prisma.appointment.create({
      data: {
        tenantId,
        serviceId,
        customerPhone,
        customerName,
        scheduledAt: new Date(scheduledAt),
        endsAt,
        status: 'CONFIRMED',
      },
      include: { service: true },
    });
  } catch (err) {
    if (err.message?.includes('no_overlap') || err.message?.includes('exclusion constraint')) {
      throw new SlotUnavailableError(scheduledAt);
    }
    throw err;
  }
}

function buildZonedDate({ date, hours, minutes, timeZone }) {
  const [year, month, day] = date.split('-').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const guessedDate = new Date(utcGuess);
  const offset = getTimeZoneOffsetMs(guessedDate, timeZone);
  return new Date(utcGuess - offset);
}

function getTimeZoneOffsetMs(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone ?? 'America/Mexico_City',
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
