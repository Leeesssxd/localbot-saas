// modules/tenants/tenants.controller.js

import { getTenantConfig, updateTenantConfig, getSchedule, updateSchedule } from './tenants.service.js';

export async function getMyTenant(request, reply) {
  const { tenantId } = request.user;
  const tenant = await getTenantConfig(tenantId);
  return reply.send(tenant);
}

export async function updateMyTenant(request, reply) {
  const { tenantId } = request.user;
  const updated = await updateTenantConfig(tenantId, request.body);
  return reply.send(updated);
}

export async function getMySchedule(request, reply) {
  const { tenantId } = request.user;
  const schedule = await getSchedule(tenantId);
  return reply.send(schedule);
}

export async function updateMySchedule(request, reply) {
  const { tenantId } = request.user;
  const { days } = request.body;
  const updated = await updateSchedule(tenantId, days);
  return reply.send(updated);
}
