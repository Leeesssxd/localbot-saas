import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { buildBookingClarification, resolveDirectBookingIntent } from '../../src/modules/webhook/webhook.service.js';
import { inferBookingContext } from '../../src/modules/webhook/booking.context.js';

describe('booking continuity', () => {
  const tenantTimeZone = 'America/Mexico_City';
  const services = [
    { id: 'svc-1', name: 'Corte de cabello', description: 'Corte profesional' },
    { id: 'svc-2', name: 'Arreglo de barba', description: 'Perfilado y diseño' },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-12T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('infers booking context from the most recent booking thread', () => {
    const context = inferBookingContext([
      { role: 'assistant', content: 'Perfecto, para Corte de cabello mañana. ¿Qué hora te gustaría?' },
      { role: 'user', content: 'Quiero agendar un corte mañana' },
    ], services, tenantTimeZone);

    expect(context.service?.id).toBe('svc-1');
    expect(context.date).toBe('2026-06-13');
    expect(context.time).toBeNull();
  });

  it('uses recent context to avoid asking for the service again', () => {
    const context = inferBookingContext([
      { role: 'assistant', content: 'Perfecto, para Corte de cabello mañana. ¿Qué hora te gustaría?' },
      { role: 'user', content: 'Quiero agendar un corte mañana' },
    ], services, tenantTimeZone);

    const reply = buildBookingClarification({
      text: 'Quiero agendarlo',
      services,
      availability: [],
      timezone: tenantTimeZone,
      bookingContext: context,
    });

    expect(reply).toBe('Perfecto, para Corte de cabello mañana. ¿Qué hora te gustaría?');
  });

  it('books directly when the follow-up only adds the missing time', () => {
    const context = inferBookingContext([
      { role: 'assistant', content: 'Perfecto, para Corte de cabello mañana. ¿Qué hora te gustaría?' },
      { role: 'user', content: 'Quiero agendar un corte mañana' },
    ], services, tenantTimeZone);

    const booking = resolveDirectBookingIntent({
      text: 'a las 10:00',
      services,
      availability: [
        { date: '2026-06-13', label: 'sábado 13 de junio', slots: ['10:00', '11:00', '15:00'] },
      ],
      timezone: tenantTimeZone,
      bookingContext: context,
    });

    expect(booking).toMatchObject({
      intent: 'BOOK',
      service_id: 'svc-1',
      scheduled_date: '2026-06-13',
      slot: '10:00',
    });
  });
});
