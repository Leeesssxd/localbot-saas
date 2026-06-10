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
export async function bookAppointment({ tenantId, serviceId, slot, customerPhone, customerName }) {
  // Validate service belongs to this tenant and is active
  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId, active: true },
  });

  if (!service) {
    throw new NotFoundError('Service');
  }

  // Parse slot (HH:MM) into today's date
  const now = new Date();
  const [hours, minutes] = slot.split(':').map(Number);
  const scheduledAt = new Date(now);
  scheduledAt.setHours(hours, minutes, 0, 0);

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
