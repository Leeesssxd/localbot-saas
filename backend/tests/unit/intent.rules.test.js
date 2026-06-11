import { describe, expect, it } from '@jest/globals';
import {
  extractRequestedDate,
  extractRequestedTime,
  isCancellationRequest,
  isRescheduleRequest,
  looksLikeBookingRequest,
  normalizeText,
  resolveBookingDate,
} from '../../src/modules/webhook/intent.rules.js';

describe('intent rules', () => {
  const getLocalDateString = () => '2026-06-12';
  const addDaysToDateString = (date, days) => {
    const base = new Date(`${date}T00:00:00.000Z`);
    base.setUTCDate(base.getUTCDate() + days);
    return base.toISOString().slice(0, 10);
  };

  it('normalizes punctuation and accents consistently', () => {
    expect(normalizeText('¿Puedes reagendarme?')).toBe('puedes reagendarme');
  });

  it('detects cancellation phrases from real user wording', () => {
    expect(isCancellationRequest('No voy a poder ir a mi cita')).toBe(true);
    expect(isCancellationRequest('¿me la puedes cancelar?')).toBe(true);
  });

  it('detects reschedule phrases from real user wording', () => {
    expect(isRescheduleRequest('¿me la puedes mover para mañana?')).toBe(true);
    expect(isRescheduleRequest('Quiero reprogramarla al jueves')).toBe(true);
  });

  it('detects booking intent and requested time', () => {
    expect(looksLikeBookingRequest('Quiero agendar una cita para 10:30')).toBe(true);
    expect(extractRequestedTime('mañana a las 5:30 pm')).toBe('17:30');
  });

  it('extracts date from natural language and resolves booking date fallback', () => {
    expect(extractRequestedDate('pasado mañana a las 10:00', 'America/Mexico_City', getLocalDateString, addDaysToDateString)).toBe('2026-06-14');
    expect(resolveBookingDate({
      scheduledDate: '',
      userMessage: 'mañana a las 10',
      timezone: 'America/Mexico_City',
      getLocalDateString,
      addDaysToDateString,
    })).toBe('2026-06-13');
  });
});
