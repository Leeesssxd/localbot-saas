// modules/services/services.repository.js

import prisma from '../../shared/db.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

export async function listServices(tenantId) {
  return prisma.service.findMany({
    where: { tenantId, active: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createService(tenantId, data) {
  return prisma.service.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description ?? null,
      durationMin: data.durationMin,
      price: data.price,
    },
  });
}

export async function updateService(tenantId, id, data) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Service');
  if (existing.tenantId !== tenantId) throw new ForbiddenError();

  return prisma.service.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      durationMin: data.durationMin ?? existing.durationMin,
      price: data.price ?? existing.price,
    },
  });
}

export async function softDeleteService(tenantId, id) {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Service');
  if (existing.tenantId !== tenantId) throw new ForbiddenError();

  return prisma.service.update({
    where: { id },
    data: { active: false },
  });
}
