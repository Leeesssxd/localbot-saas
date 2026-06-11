import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const prismaMock = {
  appointment: {
    findMany: jest.fn(),
  },
  service: {
    findMany: jest.fn(),
  },
  conversationHistory: {
    findMany: jest.fn(),
  },
};

await jest.unstable_mockModule('../../src/shared/db.js', () => ({
  default: prismaMock,
}));

const { searchTenantData } = await import('../../src/modules/search/search.service.js');

describe('searchTenantData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds conversations by message content and returns a dashboard link', async () => {
    prismaMock.appointment.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'appt-1',
          tenantId: 'tenant-1',
          customerPhone: '521555000111',
          customerName: 'Ana López',
          scheduledAt: new Date('2026-06-13T15:00:00.000Z'),
          status: 'CONFIRMED',
          service: { id: 'svc-1', name: 'Corte de cabello' },
        },
      ]);
    prismaMock.service.findMany.mockResolvedValueOnce([]);
    prismaMock.conversationHistory.findMany.mockResolvedValueOnce([
      {
        customerPhone: '521555000111',
        role: 'assistant',
        content: 'Perfecto, te ayudo con eso.',
        createdAt: new Date('2026-06-12T18:02:00.000Z'),
      },
      {
        customerPhone: '521555000111',
        role: 'user',
        content: 'Quiero un corte para mañana',
        createdAt: new Date('2026-06-12T18:00:00.000Z'),
      },
    ]);

    const result = await searchTenantData('tenant-1', 'corte');

    expect(prismaMock.conversationHistory.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        tenantId: 'tenant-1',
        OR: expect.any(Array),
      }),
      take: 200,
    }));

    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0]).toMatchObject({
      id: '521555000111',
      type: 'conversation',
      title: 'Ana López',
      subtitle: 'Perfecto, te ayudo con eso.',
      meta: 'En seguimiento',
      href: '/messages?phone=521555000111',
    });
  });

  it('returns empty result sets for short queries', async () => {
    const result = await searchTenantData('tenant-1', 'a');

    expect(result).toEqual({
      appointments: [],
      conversations: [],
      services: [],
    });
    expect(prismaMock.appointment.findMany).not.toHaveBeenCalled();
    expect(prismaMock.service.findMany).not.toHaveBeenCalled();
    expect(prismaMock.conversationHistory.findMany).not.toHaveBeenCalled();
  });
});
