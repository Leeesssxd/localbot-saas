import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { buildBookingClarification } from '../../src/modules/webhook/webhook.service.js';

describe('booking clarification', () => {
  const tenant = { timezone: 'America/Mexico_City' };
  const services = [
    { id: 'svc-1', name: 'Corte de cabello', description: 'Corte profesional' },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-12T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('asks for day and time when the user wants to book but omitted both', () => {
    const message = buildBookingClarification({
      text: 'Quiero agendar un corte',
      services,
      availability: [],
      timezone: tenant.timezone,
      tenant,
    });

    expect(message).toContain('Corte de cabello');
    expect(message).toContain('¿Para qué día y hora te gustaría agendarla?');
  });

  it('asks only for the missing time when the date is already clear', () => {
    const message = buildBookingClarification({
      text: 'Quiero agendar un corte mañana',
      services,
      availability: [
        { date: '2026-06-13', label: 'sábado 13 de junio', slots: ['10:00', '11:00', '15:00'] },
      ],
      timezone: tenant.timezone,
      tenant,
    });

    expect(message).toContain('mañana');
    expect(message).toContain('Corte de cabello');
    expect(message).toContain('¿Qué hora te gustaría?');
  });

  it('returns null when the text already contains a valid exact slot', () => {
    const message = buildBookingClarification({
      text: 'Quiero agendar un corte mañana a las 10:00',
      services,
      availability: [
        { date: '2026-06-13', label: 'sábado 13 de junio', slots: ['10:00', '11:00', '15:00'] },
      ],
      timezone: tenant.timezone,
      tenant,
    });

    expect(message).toBeNull();
  });
});
