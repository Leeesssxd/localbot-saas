// modules/ai/groq.client.js
// Groq API client — primary AI provider.
// Groq free tier: 14,400 req/day — sufficient for MVP.

import env from '../../config/env.js';
import logger from '../../shared/logger.js';
import { AITimeoutError, AIProviderError } from '../../shared/errors.js';

export async function groqComplete(messages) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.ai.groqTimeoutMs);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.ai.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.ai.groqModel,
        messages,
        max_tokens: 400,
        temperature: 0.3,  // low temperature for consistent structured output
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      logger.error({ status: response.status, body }, 'Groq API error');
      throw new AIProviderError(`Groq returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) throw new AIProviderError('Empty response from Groq');

    logger.debug({
      model: env.ai.groqModel,
      tokens: data.usage?.total_tokens,
    }, 'Groq request completed');

    return text.trim();

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') throw new AITimeoutError();
    if (err instanceof AIProviderError || err instanceof AITimeoutError) throw err;

    throw new AIProviderError(err.message);
  }
}
