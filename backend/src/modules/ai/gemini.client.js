// modules/ai/gemini.client.js
// Google Gemini Flash fallback client.
// Used when Groq is unavailable or rate-limited.

import env from '../../config/env.js';
import logger from '../../shared/logger.js';
import { AITimeoutError, AIProviderError } from '../../shared/errors.js';

export async function geminiComplete(messages) {
  if (!env.ai.geminiApiKey) {
    throw new AIProviderError('Gemini API key not configured');
  }

  const model = env.ai.geminiModel;
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.ai.groqTimeoutMs);

  // Convert OpenAI-style messages to Gemini format
  const systemMsg = messages.find((m) => m.role === 'system')?.content ?? '';
  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  try {
    const response = await fetch(`${geminiUrl}?key=${env.ai.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemMsg }] },
        contents: chatMessages,
        generationConfig: { maxOutputTokens: 400, temperature: 0.3 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      logger.error({ status: response.status, body }, 'Gemini API error');
      throw new AIProviderError(`Gemini returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new AIProviderError('Empty response from Gemini');

    logger.debug({ model }, 'Gemini fallback request completed');
    return text.trim();

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new AITimeoutError();
    if (err instanceof AIProviderError || err instanceof AITimeoutError) throw err;
    throw new AIProviderError(err.message);
  }
}
