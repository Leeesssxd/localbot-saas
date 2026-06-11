import { getConversationThread, listConversationSummaries, sendConversationReply } from './conversations.service.js';
import prisma from '../../shared/db.js';

export async function getConversations(request, reply) {
  const { tenantId } = request.user;
  const { limit } = request.query;
  const conversations = await listConversationSummaries(tenantId, limit);
  return reply.send(conversations);
}

export async function getConversationByPhone(request, reply) {
  const { tenantId } = request.user;
  const { phone } = request.params;
  const thread = await getConversationThread(tenantId, phone);
  return reply.send(thread);
}

export async function postConversationReply(request, reply) {
  const { tenantId } = request.user;
  const { phone } = request.params;
  const { text } = request.body ?? {};

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return reply.code(404).send({ error: 'Tenant not found' });
  }

  const message = await sendConversationReply({
    tenantId,
    tenant,
    customerPhone: phone,
    text,
  });

  return reply.code(201).send(message);
}
