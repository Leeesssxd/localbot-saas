// modules/appointments/appointments.controller.js

import {
  listAppointments,
  updateAppointmentStatus,
  createManualAppointment,
  rescheduleAppointment,
} from './appointments.service.js';

export async function getAppointments(request, reply) {
  const { tenantId } = request.user;
  const { from, to } = request.query;

  const fromDate = from ? new Date(from) : (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  })();
  const toDate = to ? new Date(to) : (() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d;
  })();

  const appointments = await listAppointments(tenantId, fromDate, toDate);
  return reply.send(appointments);
}

export async function createAppointment(request, reply) {
  const { tenantId } = request.user;
  const { serviceId, customerPhone, customerName, scheduledAt } = request.body;

  const appointment = await createManualAppointment({
    tenantId, serviceId, customerPhone, customerName, scheduledAt,
  });

  return reply.code(201).send(appointment);
}

export async function updateAppointment(request, reply) {
  const { tenantId } = request.user;
  const { id } = request.params;
  const { status, notes } = request.body;

  const updated = await updateAppointmentStatus(tenantId, id, status, notes);
  return reply.send(updated);
}

export async function rescheduleAppointmentHandler(request, reply) {
  const { tenantId } = request.user;
  const { id } = request.params;
  const { scheduledAt, notes } = request.body;

  const updated = await rescheduleAppointment({
    tenantId,
    appointmentId: id,
    scheduledAt,
    notes,
  });

  return reply.send(updated);
}
