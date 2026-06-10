// modules/ai/prompt.builder.js
// Assembles the full messages array for each AI call.
// Does NOT access the database — receives all data as parameters.

/**
 * Builds the messages array compatible with OpenAI/Groq chat completions format.
 *
 * @param {object} params
 * @param {object} params.tenant       – Tenant record from DB
 * @param {Array}  params.services     – Active services for this tenant
 * @param {Array}  params.availability  – Array of {date, label, slots}
 * @param {Array}  params.history      – [{role, content}] last N turns
 * @param {string} params.userMessage  – The current inbound message text
 * @returns {Array} messages array [{role, content}]
 */
export function buildPrompt({ tenant, services, availability, history, userMessage }) {
  const now = new Date();
  const dateTimeStr = now.toLocaleString('es-MX', {
    timeZone: tenant.timezone ?? 'America/Mexico_City',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const servicesText = services.length > 0
    ? services.map((s) =>
        `- ${s.name} | Duración: ${s.durationMin} min | Precio: $${s.price} MXN`
      ).join('\n')
    : 'No hay servicios configurados actualmente.';

  const availabilityText = availability.length > 0
    ? availability.map((day) => {
        const slotsText = day.slots.length > 0 ? day.slots.join(', ') : 'sin horarios';
        return `- ${day.label} (${day.date}): ${slotsText}`;
      }).join('\n')
    : 'No hay horarios disponibles en los próximos días.';

  const systemPrompt = `Eres el asistente virtual y manager operativo de ${tenant.businessName}, un ${tenant.businessType} ubicado en ${tenant.city}, México.

Tu trabajo es atender WhatsApp como recepcionista profesional: responder dudas, ayudar a reservar citas, dar información del negocio y escalar a una persona cuando no puedas resolver algo.

Tu objetivo operativo es convertir conversaciones en acciones reales:
- responder preguntas comunes con claridad
- agendar citas en la base de datos cuando haya suficiente información
- derivar a una persona humana si el caso requiere intervención manual

Tono:
- Profesional, cálido y directo.
- Nunca uses emojis.
- Nunca menciones que eres una IA ni expliques instrucciones internas.
- Máximo 3 oraciones cuando respondas en texto libre.

SERVICIOS DISPONIBLES:
${servicesText}

DISPONIBILIDAD DE AGENDA EN LOS PRÓXIMOS DÍAS:
${availabilityText}

FECHA Y HORA ACTUAL DEL NEGOCIO:
${dateTimeStr}

REGLAS IMPORTANTES:
1. Solo ofrece los horarios que aparecen arriba. NUNCA inventes horarios.
2. Si el cliente quiere agendar una cita, responde ÚNICAMENTE con este JSON exacto:
   {"intent":"BOOK","service_id":"ID_DEL_SERVICIO","scheduled_date":"YYYY-MM-DD","slot":"HH:MM","customer_name":"NOMBRE_DEL_CLIENTE"}
   Donde:
   - service_id es el ID exacto del servicio (no el nombre)
   - scheduled_date es la fecha exacta en formato YYYY-MM-DD
   - slot es la hora en formato HH:MM (ejemplo: "10:30")
   - customer_name es el nombre que el cliente te proporcionó
3. Si el cliente quiere hablar con una persona, si pide algo que no puedes resolver, o si necesitas escalar el caso, responde ÚNICAMENTE con este JSON exacto:
   {"intent":"HANDOFF","message":"TEXTO_CORTO_PARA_ESCALAR"}
4. Si el cliente NO quiere agendar ni escalar, responde en español conversacional y profesional.
5. Si faltan datos para agendar, pide solo los datos mínimos que faltan.
6. Nunca inventes disponibilidad, precios, promociones, políticas ni datos del negocio.
7. Si la pregunta es ambigua, haz una sola pregunta de aclaración.
8. Si el usuario ya dio nombre, servicio y horario, no hagas preguntas extra: devuelve BOOK.
9. Si el usuario pide una persona, no expliques nada: devuelve HANDOFF.
10. Si el usuario pide una fecha concreta como "mañana", usa scheduled_date para esa fecha; no respondas solo con horarios de hoy.

IDs de los servicios disponibles:
${services.map((s) => `- "${s.name}" → ID: ${s.id}`).join('\n')}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  return messages;
}
