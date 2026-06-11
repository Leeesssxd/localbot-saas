import { getDashboardSummary } from './analytics.service.js';

export async function getSummary(request, reply) {
  const { tenantId } = request.user;
  const summary = await getDashboardSummary(tenantId);
  return reply.send(summary);
}
