import { describe, expect, it } from '@jest/globals';
import {
  buildUnavailableSlotMessage,
  collectAlternativeSlots,
  resolveRescheduleDateTime,
} from '../../src/modules/webhook/slot.suggestions.js';

describe('slot suggestions', () => {
  const tenant = { timezone: 'America/Mexico_City' };

  it('suggests nearby slots from the same day first', () => {
    const availability = [
      {
        date: '2026-06-12',
        label: 'viernes 12 de junio',
        slots: ['10:00', '10:30', '11:00'],
      },
      {
        date: '2026-06-13',
        label: 'sábado 13 de junio',
        slots: ['09:00'],
      },
    ];

    const alternatives = collectAlternativeSlots({
      availability,
      requestedDate: '2026-06-12',
      requestedTime: '10:30',
    });

    expect(alternatives[0]).toMatchObject({ date: '2026-06-12', time: '10:30' });
    expect(alternatives[1]).toMatchObject({ date: '2026-06-12', time: '10:00' });
    expect(alternatives[2]).toMatchObject({ date: '2026-06-12', time: '11:00' });
  });

  it('builds a natural unavailable-slot message with suggestions', () => {
    const availability = [
      {
        date: '2026-06-12',
        label: 'viernes 12 de junio',
        slots: ['10:00', '10:30', '11:00'],
      },
    ];

    const message = buildUnavailableSlotMessage({
      tenant,
      availability,
      requestedDate: '2026-06-12',
      requestedTime: '10:30',
      reschedule: false,
    });

    expect(message).toContain('Lo sentimos, ese horario ya no está disponible.');
    expect(message).toContain('viernes 12 de junio a las 10:00');
    expect(message).toContain('¿Cuál te queda mejor?');
  });

  it('resolves reschedule date-time using the appointment day when the user only gives a time', () => {
    const appointment = { scheduledAt: '2026-06-12T16:00:00.000Z' };

    const scheduled = resolveRescheduleDateTime('a las 5:30', 'America/Mexico_City', appointment);

    expect(scheduled).toBeInstanceOf(Date);
    expect(Number.isNaN(scheduled.getTime())).toBe(false);
  });
});
