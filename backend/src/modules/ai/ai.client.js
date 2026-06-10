// modules/ai/ai.client.js
// Abstract interface for AI providers.
// Prefer Gemini automatically when its key is configured; fall back to Groq when needed.
// WebhookService only ever imports getAIClient() from here — it has zero knowledge of Groq/Gemini.

import env from '../../config/env.js';
import { groqComplete } from './groq.client.js';
import { geminiComplete } from './gemini.client.js';
import logger from '../../shared/logger.js';

function resolveProvider() {
  const configured = (env.ai.provider ?? '').toLowerCase();

  if (configured === 'gemini' || configured === 'groq') return configured;
  if (env.ai.geminiApiKey) return 'gemini';
  if (env.ai.groqApiKey) return 'groq';
  return 'gemini';
}

function buildClient(provider) {
  switch (provider) {
    case 'gemini':
      return {
        async complete(messages) {
          try {
            return await geminiComplete(messages);
          } catch (err) {
            if (!env.ai.groqApiKey) throw err;
            logger.warn({ err: err.message }, 'Gemini failed, falling back to Groq');
            return groqComplete(messages);
          }
        },
      };
    case 'groq':
    default:
      return {
        async complete(messages) {
          try {
            return await groqComplete(messages);
          } catch (err) {
            if (!env.ai.geminiApiKey) throw err;
            logger.warn({ err: err.message }, 'Groq failed, falling back to Gemini');
            return geminiComplete(messages);
          }
        },
      };
  }
}

const client = buildClient(resolveProvider());

logger.info({ provider: resolveProvider() }, 'AI client initialized');

export function getAIClient() {
  return client;
}
