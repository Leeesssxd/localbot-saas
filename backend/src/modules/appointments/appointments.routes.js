// modules/appointments/appointments.routes.js

import { getAppointments, createAppointment, updateAppointment } from './appointments.controller.js';

export default async function appointmentsRoutes(fastify) {
  fastify.get('/appointments', { preHandler: [fastify.authenticate] }, getAppointments);
  fastify.post('/appointments', { preHandler: [fastify.authenticate] }, createAppointment);
  fastify.patch('/appointments/:id', { preHandler: [fastify.authenticate] }, updateAppointment);
}
