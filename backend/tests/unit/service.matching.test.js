import { describe, expect, it } from '@jest/globals';
import { findMatchingService } from '../../src/modules/webhook/service.matching.js';

describe('service matching', () => {
  const services = [
    { id: 'svc-haircut', name: 'Corte de cabello', description: 'Corte profesional para dama y caballero' },
    { id: 'svc-kids', name: 'Corte infantil', description: 'Corte para ninos' },
    { id: 'svc-beard', name: 'Arreglo de barba', description: 'Perfilado y diseño de barba' },
    { id: 'svc-color', name: 'Coloración', description: 'Tinte y retoque de color' },
  ];

  it('matches a service by partial natural wording', () => {
    const match = findMatchingService('quiero un corte para mañana', services);
    expect(match?.id).toBe('svc-haircut');
  });

  it('matches a service using description keywords when the name is not explicit', () => {
    const match = findMatchingService('me gustaría un perfilado de barba', services);
    expect(match?.id).toBe('svc-beard');
  });

  it('prefers the regular haircut when the message only says corte', () => {
    const match = findMatchingService('mi novia quiere un corte a las 2', services);
    expect(match?.id).toBe('svc-haircut');
  });

  it('returns null when the text does not resemble any service', () => {
    const match = findMatchingService('solo quería saludar', services);
    expect(match).toBeNull();
  });
});
