// modules/tenants/tenants.service.js

import prisma from '../../shared/db.js';
import { NotFoundError } from '../../shared/errors.js';

export async function getTenantConfig(tenantId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      businessName: true,
      businessType: true,
      city: true,
      timezone: true,
      status: true,
      trialEnd: true,
      businessOpen: true,
      closureMessage: true,
      suspendedMessage: true,
      createdAt: true,
    },
  });

  if (!tenant) throw new NotFoundError('Tenant');
  return tenant;
}

export async function updateTenantConfig(tenantId, data) {
  const allowed = ['businessName', 'businessOpen', 'closureMessage', 'suspendedMessage', 'city'];
  const updateData = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }

  return prisma.tenant.update({
    where: { id: tenantId },
    data: updateData,
    select: {
      id: true,
      businessName: true,
      businessOpen: true,
      closureMessage: true,
      suspendedMessage: true,
      status: true,
      trialEnd: true,
    },
  });
}

export async function getSchedule(tenantId) {
  return prisma.scheduleTemplate.findMany({
    where: { tenantId },
    orderBy: { dayOfWeek: 'asc' },
  });
}

export async function updateSchedule(tenantId, days) {
  // days: [{dayOfWeek, isOpen, openTime, closeTime}]
  const ops = days.map((day) =>
    prisma.scheduleTemplate.upsert({
      where: { tenantId_dayOfWeek: { tenantId, dayOfWeek: day.dayOfWeek } },
      update: { isOpen: day.isOpen, openTime: day.openTime, closeTime: day.closeTime },
      create: { tenantId, ...day },
    })
  );
  return Promise.all(ops);
}
