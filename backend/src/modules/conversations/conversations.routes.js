import { getConversations, getConversationByPhone, postConversationReply } from './conversations.controller.js';

export default async function conversationsRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] };

  fastify.get('/conversations', auth, getConversations);
  fastify.get('/conversations/:phone', auth, getConversationByPhone);
  fastify.post('/conversations/:phone/reply', auth, postConversationReply);
}
