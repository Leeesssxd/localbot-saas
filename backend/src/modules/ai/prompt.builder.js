// modules/ai/prompt.builder.js
// Assembles the full messages array for each AI call.
// Does NOT access the database — receives all data as parameters.

/**
 * Builds the messages array compatible with OpenAI/Groq chat completions format.
 *
 * @param {object} params
 * @param {object} params.tenant       – Tenant record from DB
 * @param {Array}  params.services     – Active services for this tenant
 * @param {Array}  params.slots        – Available slots (strings: "09:00", "09:30", ...)
 * @param {Array}  params.history      – [{role, content}] last N turns
 * @param {string} params.userMessage  – The current inbound message text
 * @returns {Array} messages array [{role, content}]
 */
export function buildPrompt({ tenant, services, slots, history, userMessage }) {
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

  const slotsText = slots.length > 0
    ? slots.join(', ')
    : 'No hay horarios disponibles hoy.';

  const systemPrompt = `Eres el asistente virtual de ${tenant.businessName}, un ${tenant.businessType} ubicado en ${tenant.city}, México.

Tu rol: Responder preguntas sobre el negocio, informar sobre servicios y precios, y agendar citas.

SERVICIOS DISPONIBLES:
${servicesText}

HORARIOS DISPONIBLES HOY (${dateTimeStr}):
${slotsText}

REGLAS IMPORTANTES:
1. Solo ofrece los horarios que aparecen arriba. NUNCA inventes horarios.
2. Si el cliente quiere agendar una cita, responde ÚNICAMENTE con este JSON exacto:
   {"intent":"BOOK","service_id":"ID_DEL_SERVICIO","slot":"HH:MM","customer_name":"NOMBRE_DEL_CLIENTE"}
   Donde:
   - service_id es el ID exacto del servicio (no el nombre)
   - slot es la hora en formato HH:MM (ejemplo: "10:30")
   - customer_name es el nombre que el cliente te proporcionó
3. Si el cliente NO quiere agendar, responde en español conversacional y amigable.
4. Sé conciso: máximo 3 oraciones por respuesta.
5. Usa emojis con moderación para ser más amigable.
6. Si el cliente pregunta por algo que no puedes hacer (pagos, reservar para otra persona sin nombre), pídele los datos que necesitas.

IDs de los servicios disponibles:
${services.map((s) => `- "${s.name}" → ID: ${s.id}`).join('\n')}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  return messages;
}
