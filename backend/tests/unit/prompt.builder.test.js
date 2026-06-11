import { describe, expect, it } from '@jest/globals';
import { buildPrompt } from '../../src/modules/ai/prompt.builder.js';

describe('buildPrompt', () => {
  it('includes the inferred booking context in the system prompt', () => {
    const messages = buildPrompt({
      tenant: {
        businessName: 'LocalBot Studio',
        businessType: 'salón',
        city: 'Guadalajara',
        timezone: 'America/Mexico_City',
      },
      services: [
        { id: 'svc-1', name: 'Corte de cabello', durationMin: 30, price: 250 },
      ],
      availability: [],
      history: [],
      bookingContext: {
        service: { id: 'svc-1', name: 'Corte de cabello' },
        date: '2026-06-13',
        time: '10:00',
      },
      userMessage: 'Quiero confirmar la cita',
    });

    expect(messages[0].content).toContain('CONTEXTO RECIENTE DE AGENDA');
    expect(messages[0].content).toContain('servicio probable: Corte de cabello');
    expect(messages[0].content).toContain('fecha probable: 2026-06-13');
    expect(messages[0].content).toContain('hora probable: 10:00');
  });

  it('tells the model to keep continuity and answer more naturally', () => {
    const messages = buildPrompt({
      tenant: {
        businessName: 'LocalBot Studio',
        businessType: 'salón',
        city: 'Guadalajara',
        timezone: 'America/Mexico_City',
      },
      services: [],
      availability: [],
      history: [],
      bookingContext: null,
      userMessage: 'Hola',
    });

    const systemPrompt = messages[0].content;
    expect(systemPrompt).toContain('No repitas siempre la misma apertura');
    expect(systemPrompt).toContain('usa el contexto reciente como continuidad real');
    expect(systemPrompt).toContain('responde de forma humana y útil');
    expect(systemPrompt).toContain('continua esa misma intención');
  });
});
