// modules/whatsapp/whatsapp.client.js
// Sends outbound text messages via Meta WhatsApp Cloud API.

import env from '../../config/env.js';
import logger from '../../shared/logger.js';

/**
 * Sends a text message to a customer via Meta's WhatsApp Cloud API.
 *
 * @param {object} tenant    – Tenant record (needs phoneNumberId, waAccessToken)
 * @param {string} toPhone   – Customer's phone number (without +, e.g. "521234567890")
 * @param {string} text      – Message to send
 */
export async function sendWhatsAppMessage(tenant, toPhone, text) {
  const url = `${env.meta.apiUrl}/${tenant.phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    to: toPhone,
    type: 'text',
    text: { body: text },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tenant.waAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      logger.error(
        { tenantId: tenant.id, toPhone, status: response.status, errorBody },
        'WhatsApp message send failed'
      );
      return false;
    }

    const data = await response.json();
    logger.debug(
      { tenantId: tenant.id, toPhone, messageId: data.messages?.[0]?.id },
      'WhatsApp message sent'
    );
    return true;

  } catch (err) {
    logger.error(
      { tenantId: tenant.id, toPhone, err: err.message },
      'Network error sending WhatsApp message'
    );
    return false;
  }
}
