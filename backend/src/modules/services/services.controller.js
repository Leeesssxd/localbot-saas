// modules/services/services.controller.js

import { listServices, createService, updateService, softDeleteService } from './services.repository.js';

export async function getServices(request, reply) {
  const { tenantId } = request.user;
  const services = await listServices(tenantId);
  return reply.send(services);
}

export async function postService(request, reply) {
  const { tenantId } = request.user;
  const service = await createService(tenantId, request.body);
  return reply.code(201).send(service);
}

export async function putService(request, reply) {
  const { tenantId } = request.user;
  const { id } = request.params;
  const updated = await updateService(tenantId, id, request.body);
  return reply.send(updated);
}

export async function deleteService(request, reply) {
  const { tenantId } = request.user;
  const { id } = request.params;
  await softDeleteService(tenantId, id);
  return reply.code(204).send();
}
