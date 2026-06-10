// modules/ai/ai.client.js
// Abstract interface for AI providers.
// Switching from Groq to Gemini is a one-line env var change: AI_PROVIDER=gemini
// WebhookService only ever imports getAIClient() from here — it has zero knowledge of Groq/Gemini.

import env from '../../config/env.js';
import { groqComplete } from './groq.client.js';
import { geminiComplete } from './gemini.client.js';
import logger from '../../shared/logger.js';

function buildClient(provider) {
  switch (provider) {
    case 'gemini':
      return { complete: geminiComplete };
    case 'groq':
    default:
      return { complete: groqComplete };
  }
}

const client = buildClient(env.ai.provider);

logger.info({ provider: env.ai.provider }, 'AI client initialized');

export function getAIClient() {
  return client;
}
