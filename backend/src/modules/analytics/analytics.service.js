import prisma from '../../shared/db.js';
import { listConversationSummaries } from '../conversations/conversations.service.js';

export async function getDashboardSummary(tenantId) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const [appointments, upcomingAppointments, distinctConversationCount, inboundLogs, outboundLogs, conversations] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        tenantId,
        scheduledAt: { gte: startOfWeek },
      },
      include: { service: true },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId,
        scheduledAt: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { service: true },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    }),
    prisma.conversationHistory.groupBy({
      by: ['customerPhone'],
      where: { tenantId },
      _count: { customerPhone: true },
    }),
    prisma.webhookLog.count({
      where: {
        tenantId,
        direction: 'IN',
        status: 'PROCESSED',
        createdAt: { gte: startOfWeek },
      },
    }),
    prisma.webhookLog.count({
      where: {
        tenantId,
        direction: 'OUT',
        status: 'PROCESSED',
        createdAt: { gte: startOfWeek },
      },
    }),
    listConversationSummaries(tenantId, 8),
  ]);

  const todayAppointments = appointments.filter((item) => isSameDay(item.scheduledAt, now));
  const weekAppointments = appointments.filter((item) => item.status !== 'CANCELLED');
  const confirmedToday = todayAppointments.filter((item) => item.status === 'CONFIRMED').length;
  const pendingToday = todayAppointments.filter((item) => item.status === 'PENDING').length;
  const cancelledWeek = appointments.filter((item) => item.status === 'CANCELLED').length;

  return {
    totals: {
      todayAppointments: todayAppointments.filter((item) => item.status !== 'CANCELLED').length,
      weekAppointments: weekAppointments.length,
      confirmedToday,
      pendingToday,
      cancelledWeek,
      activeConversations: distinctConversationCount.length,
      inboundMessages: inboundLogs,
      outboundMessages: outboundLogs,
    },
    upcomingAppointments: upcomingAppointments.map((appt) => ({
      id: appt.id,
      customerName: appt.customerName,
      customerPhone: appt.customerPhone,
      scheduledAt: appt.scheduledAt,
      status: appt.status,
      service: appt.service,
    })),
    recentConversations: conversations,
  };
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
  );
}
