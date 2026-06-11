import { normalizeText } from './intent.rules.js';

export function findMatchingService(normalizedText, services) {
  if (!normalizedText || !Array.isArray(services)) return null;

  const textTokens = new Set(tokenize(normalizedText));
  let bestMatch = null;
  let bestScore = 0;

  for (const service of services) {
    const name = normalizeText(service.name);
    const description = normalizeText(service.description ?? '');
    const serviceTokens = new Set([
      ...tokenize(name),
      ...tokenize(description),
    ]);

    let score = 0;
    if (name && normalizedText.includes(name)) score += 100;
    if (description && normalizedText.includes(description)) score += 25;

    let overlap = 0;
    for (const token of serviceTokens) {
      if (textTokens.has(token)) {
        overlap += 1;
      } else if (token.length >= 4 && normalizedText.includes(token)) {
        overlap += 0.75;
      }
    }

    score += overlap * 10;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = service;
    }
  }

  return bestScore >= 10 ? bestMatch : null;
}

function tokenize(text) {
  return (text ?? '')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}
