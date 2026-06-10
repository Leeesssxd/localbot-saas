# Requisitos Funcionales

Este documento resume el alcance funcional de LocalBot para tener un enlace corto y directo dentro del repositorio.

## Objetivo

Construir un SaaS multi-tenant que conecte WhatsApp con IA para que negocios locales puedan responder mensajes, agendar citas y administrar su operación desde un panel web.

## Componentes clave

- Webhook de WhatsApp para recibir mensajes entrantes.
- Backend Fastify para auth, lógica de citas, servicios, horarios y AI.
- Panel web React para administración del negocio.
- PostgreSQL / Supabase como base de datos.

## Funcionalidades del panel

- Inicio de sesión de administrador.
- Dashboard con métricas, actividad y agenda.
- Centro de mensajes para revisar conversaciones.
- Calendario con citas y acciones rápidas.
- CRUD de servicios.
- Configuración del negocio, horario y WhatsApp.
- Modo oscuro para mejorar usabilidad en sesiones largas.

## Integraciones

- WhatsApp Cloud API oficial de Meta.
- Groq como proveedor principal de IA.
- Gemini como fallback.
- Railway para backend.
- Vercel para frontend.

## Notas de alcance

- El bloqueo comercial y de suscripciones se pospone para una fase futura.
- El objetivo actual es cerrar bien la experiencia del panel y la conexión operativa con WhatsApp.
