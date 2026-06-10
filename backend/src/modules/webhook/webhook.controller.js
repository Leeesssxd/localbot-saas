// modules/webhook/webhook.controller.js
// Handles GET (challenge verification) and POST (inbound messages) from Meta.
// Critical: POST must return 200 immediately, BEFORE async processing.

import { validateWebhookSignature } from './webhook.validator.js';
import { processInboundMessage } from './webhook.service.js';
import prisma from '../../shared/db.js';
import logger from '../../shared/logger.js';
import env from '../../config/env.js';

// GET /webhook/:tenantId — Meta verification challenge
export async function handleVerification(request, reply) {
  const { tenantId } = request.params;
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = request.query;

  if (mode !== 'subscribe') {
    return reply.code(400).send({ error: 'Invalid hub.mode' });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return reply.code(404).send({ error: 'Tenant not found' });
  }

  if (token !== tenant.webhookVerifyToken) {
    logger.warn({ tenantId, token }, 'Webhook verification failed: token mismatch');
    return reply.code(403).send({ error: 'Verification token mismatch' });
  }

  logger.info({ tenantId }, 'Webhook verified successfully');
  return reply.code(200).send(challenge);
}

// POST /webhook/:tenantId — Inbound messages from Meta
export async function handleInboundMessage(request, reply) {
  const { tenantId } = request.params;

  // Validate HMAC signature using Meta app secret
  // In production, the Meta App Secret is stored as env var or per-tenant.
  // For MVP simplicity, we use a single global app secret.
  const signature = request.headers['x-hub-signature-256'];
  const rawBody = request.rawBody;

  const metaAppSecret = process.env.META_APP_SECRET;

  if (metaAppSecret) {
    try {
      validateWebhookSignature(rawBody, signature, metaAppSecret);
    } catch (err) {
      logger.warn({ tenantId, err: err.message }, 'Invalid webhook signature — rejecting');
      return reply.code(401).send({ error: 'Invalid signature' });
    }
  } else {
    logger.warn({ tenantId }, 'META_APP_SECRET not set — skipping signature validation (dev mode)');
  }

  // ⚡ Return 200 IMMEDIATELY — Meta will retry if we delay
  reply.code(200).send({ status: 'ok' });

  // Process asynchronously after responding to Meta
  setImmediate(() => {
    processInboundMessage(tenantId, request.body, metaAppSecret).catch((err) => {
      logger.error({ tenantId, err: err.message }, 'Fatal error in async message processing');
    });
  });
}
