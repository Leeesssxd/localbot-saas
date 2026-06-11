// src/app.js
// LocalBot backend entry point.
// Initializes Fastify, registers plugins and routes, starts the server.

import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';

import env from './config/env.js';
import logger from './shared/logger.js';
import prisma from './shared/db.js';

import jwtPlugin from './modules/auth/jwt.plugin.js';
import webhookRoutes from './modules/webhook/webhook.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import tenantsRoutes from './modules/tenants/tenants.routes.js';
import servicesRoutes from './modules/services/services.routes.js';
import appointmentsRoutes from './modules/appointments/appointments.routes.js';
import conversationsRoutes from './modules/conversations/conversations.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import searchRoutes from './modules/search/search.routes.js';

import { startSuspendExpiredJob } from './jobs/suspend-expired.js';

const fastify = Fastify({
  logger: false, // Using pino directly for structured logging
  trustProxy: true,
});

// ── Plugins ──────────────────────────────────────────────────────────────────

await fastify.register(helmet, {
  contentSecurityPolicy: false, // CSP handled by frontend host
});

await fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    const allowed = [
      env.frontendUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ].filter(Boolean);

    const isAllowed =
      allowed.includes(origin) ||
      /^https:\/\/.*\.vercel\.app$/.test(origin) ||
      /^https:\/\/.*\.vercel\.sh$/.test(origin) ||
      /^https:\/\/.*\.vercel\.com$/.test(origin);

    cb(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

await fastify.register(cookie, {
  secret: env.jwt.refreshSecret, // signs cookies
  parseOptions: {},
});

await fastify.register(jwtPlugin);

// ── Error handler ─────────────────────────────────────────────────────────────

fastify.setErrorHandler((err, request, reply) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';

  if (statusCode >= 500) {
    logger.error({ err: err.message, stack: err.stack, url: request.url }, 'Unhandled error');
  } else {
    logger.warn({ err: message, url: request.url }, 'Request error');
  }

  return reply.code(statusCode).send({ error: message });
});

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check — used by UptimeRobot to keep Railway alive
fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

await fastify.register(webhookRoutes);
await fastify.register(authRoutes);
await fastify.register(tenantsRoutes);
await fastify.register(servicesRoutes);
await fastify.register(appointmentsRoutes);
await fastify.register(conversationsRoutes);
await fastify.register(analyticsRoutes);
await fastify.register(searchRoutes);

// ── Start ─────────────────────────────────────────────────────────────────────

async function start() {
  try {
    // Verify DB connection on startup
    await prisma.$connect();
    logger.info('Database connected');

    await fastify.listen({ port: env.port, host: '0.0.0.0' });
    logger.info({ port: env.port, env: env.nodeEnv }, '🚀 LocalBot backend running');

    // Start cron jobs only after the app is actually ready.
    startSuspendExpiredJob();

  } catch (err) {
    logger.error({
      err: err.message,
      diagnosis: diagnoseStartupError(err),
    }, 'Failed to start server');
    await fastify.close().catch(() => {});
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

function diagnoseStartupError(err) {
  const message = String(err?.message ?? '');
  if (/authentication failed/i.test(message)) {
    return 'DATABASE_URL credentials are invalid. Recheck the Supabase password/user and ensure you are using the current connection string.';
  }
  if (/can't reach database server/i.test(message) || /ECONNREFUSED|ETIMEDOUT/i.test(message)) {
    return 'The database host is unreachable. Confirm the Supabase host, port, network access, and that the project is online.';
  }
  if (/Missing required environment variable/i.test(message)) {
    return 'A required environment variable is missing. Check backend/.env against .env.example.';
  }
  return 'Check backend/.env and the remote database connection.';
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
