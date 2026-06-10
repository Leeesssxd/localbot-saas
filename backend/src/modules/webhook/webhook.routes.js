// modules/webhook/webhook.routes.js

import { handleVerification, handleInboundMessage } from './webhook.controller.js';

export default async function webhookRoutes(fastify) {
  // Meta challenge verification
  fastify.get('/webhook/:tenantId', handleVerification);

  // Inbound messages — raw body capture required for HMAC validation
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    req.rawBody = body;
    try {
      done(null, JSON.parse(body));
    } catch (err) {
      done(err);
    }
  });

  fastify.post('/webhook/:tenantId', handleInboundMessage);
}
