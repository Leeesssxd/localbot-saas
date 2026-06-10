// modules/webhook/webhook.validator.js
// Validates the X-Hub-Signature-256 header sent by Meta on every webhook POST.
// See: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests

import crypto from 'crypto';
import { InvalidSignatureError } from '../../shared/errors.js';

/**
 * Validates the Meta webhook signature.
 * @param {string} rawBody  – the raw request body (string, not parsed)
 * @param {string} signature – value of X-Hub-Signature-256 header
 * @param {string} secret   – the tenant's webhook secret (webhookVerifyToken is not this;
 *                            Meta signs with the app secret set in the Meta Developer dashboard)
 */
export function validateWebhookSignature(rawBody, signature, secret) {
  if (!signature || !signature.startsWith('sha256=')) {
    throw new InvalidSignatureError();
  }

  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expBuffer.length) throw new InvalidSignatureError();

  if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    throw new InvalidSignatureError();
  }
}

/**
 * Extracts the relevant fields from a Meta webhook payload.
 * Returns null if the message is not a text message (images, reactions, etc.).
 */
export function extractMessageData(payload) {
  try {
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages) return null;

    const message = value.messages[0];
    if (!message) return null;

    // Only process text messages in MVP (FR-09: ignore images, audio, etc.)
    if (message.type !== 'text') return null;

    return {
      waMessageId: message.id,
      fromPhone: message.from,
      text: message.text?.body ?? '',
      timestamp: new Date(parseInt(message.timestamp, 10) * 1000),
      phoneNumberId: value.metadata?.phone_number_id,
    };
  } catch {
    return null;
  }
}
