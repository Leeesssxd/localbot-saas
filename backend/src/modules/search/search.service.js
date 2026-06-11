import prisma from '../../shared/db.js';

const MAX_RESULTS = 5;
const MAX_CONVERSATION_ROWS = 200;

export async function searchTenantData(tenantId, query) {
  const term = (query ?? '').trim();
  if (term.length < 2) {
    return {
      appointments: [],
      conversations: [],
      services: [],
    };
  }

  const [appointments, services, conversationRows] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        tenantId,
        OR: [
          { customerName: { contains: term, mode: 'insensitive' } },
          { customerPhone: { contains: term } },
          { notes: { contains: term, mode: 'insensitive' } },
          { service: { is: { name: { contains: term, mode: 'insensitive' } } } },
        ],
      },
      include: { service: true },
      orderBy: { scheduledAt: 'desc' },
      take: MAX_RESULTS,
    }),
    prisma.service.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: MAX_RESULTS,
    }),
    prisma.conversationHistory.findMany({
      where: {
        tenantId,
        OR: [
          { customerPhone: { contains: term } },
          { content: { contains: term, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_CONVERSATION_ROWS,
    }),
  ]);

  const normalizedTerm = term.toLowerCase();
  const conversationsByPhone = new Map();
  for (const row of conversationRows) {
    if (!conversationsByPhone.has(row.customerPhone)) {
      conversationsByPhone.set(row.customerPhone, []);
    }
    conversationsByPhone.get(row.customerPhone).push(row);
  }

  const matchedPhones = [...conversationsByPhone.keys()];
  const appointmentsForConversations = matchedPhones.length > 0
    ? await prisma.appointment.findMany({
        where: {
          tenantId,
          customerPhone: { in: matchedPhones },
        },
        include: { service: true },
        orderBy: { scheduledAt: 'desc' },
      })
    : [];

  const appointmentsByPhone = new Map();
  for (const appointment of appointmentsForConversations) {
    if (!appointmentsByPhone.has(appointment.customerPhone)) {
      appointmentsByPhone.set(appointment.customerPhone, appointment);
    }
  }

  const filteredConversations = [...conversationsByPhone.entries()]
    .map(([customerPhone, rows]) => {
      const thread = rows.slice().reverse();
      const lastUser = [...rows].find((row) => row.role === 'user');
      const lastAssistant = [...rows].find((row) => row.role === 'assistant');
      const latestRow = rows[0];
      const latestAppointment = appointmentsByPhone.get(customerPhone) ?? null;
      const lastMessage = thread[thread.length - 1] ?? null;

      return {
        id: customerPhone,
        type: 'conversation',
        title: inferCustomerName(lastUser?.content, latestAppointment?.customerName, customerPhone),
        subtitle: derivePreview(lastMessage?.content ?? latestRow.content),
        meta: deriveStatus({ lastUser, lastAssistant, latestAppointment, latestRow }),
        href: `/messages?phone=${encodeURIComponent(customerPhone)}`,
        updatedAt: latestRow.createdAt,
      };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, MAX_RESULTS);

  return {
    appointments: appointments.map((item) => ({
      id: item.id,
      type: 'appointment',
      title: item.customerName,
      subtitle: `${item.service?.name ?? 'Servicio'} · ${item.customerPhone}`,
      meta: formatAppointmentMeta(item),
      href: `/calendar?appointmentId=${encodeURIComponent(item.id)}`,
      updatedAt: item.updatedAt,
    })),
    conversations: filteredConversations,
    services: services.map((item) => ({
      id: item.id,
      type: 'service',
      title: item.name,
      subtitle: item.description?.trim() || `${Number(item.durationMin ?? 0)} min · $${Number(item.price ?? 0).toFixed(2)}`,
      meta: `${Number(item.durationMin ?? 0)} min`,
      href: `/services?q=${encodeURIComponent(term)}`,
      updatedAt: item.updatedAt,
    })),
  };
}

function derivePreview(content) {
  return truncate(content?.trim() || 'Sin actividad reciente', 92);
}

function inferCustomerName(userMessage, appointmentName, fallbackPhone) {
  if (appointmentName?.trim()) return appointmentName.trim();

  const candidates = [
    /(?:me llamo|soy|mi nombre es)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\- ]{2,40})/i,
    /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\- ]{3,40})$/i,
  ];

  const source = userMessage?.trim() ?? '';
  for (const regex of candidates) {
    const match = source.match(regex);
    if (match?.[1]) {
      return match[1].trim().replace(/\s+/g, ' ');
    }
  }

  return formatPhoneFallback(fallbackPhone);
}

function deriveStatus({ lastUser, lastAssistant, latestAppointment, latestRow }) {
  const userText = (lastUser?.content ?? '').toLowerCase();
  const assistantText = (lastAssistant?.content ?? '').toLowerCase();
  const latestText = (latestRow?.content ?? '').toLowerCase();

  if (userText.includes('cancel') || userText.includes('reagend') || userText.includes('mover')) {
    return 'Requiere atención';
  }

  if (latestAppointment?.status === 'PENDING') {
    return 'Pendiente de confirmación';
  }

  if (latestAppointment?.status === 'CONFIRMED' && assistantText.includes('cita confirmada')) {
    return 'Confirmada';
  }

  if (latestText.includes('?')) {
    return 'Consulta abierta';
  }

  return 'En seguimiento';
}

function truncate(text, maxLength) {
  const value = text ?? '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function formatPhoneFallback(phone) {
  if (!phone) return 'Cliente';
  const lastDigits = phone.replace(/\D/g, '').slice(-4);
  return lastDigits ? `Cliente ${lastDigits}` : 'Cliente';
}

function formatAppointmentMeta(appointment) {
  const scheduled = new Date(appointment.scheduledAt);
  const date = scheduled.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
  const time = scheduled.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${date} · ${time} · ${appointment.status}`;
}
