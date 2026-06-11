import { getSummary } from './analytics.controller.js';

export default async function analyticsRoutes(fastify) {
  fastify.get('/analytics/summary', { preHandler: [fastify.authenticate] }, getSummary);
}
