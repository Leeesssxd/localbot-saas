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

// ── Start ─────────────────────────────────────────────────────────────────────

async function start() {
  try {
    await fastify.listen({ port: env.port, host: '0.0.0.0' });
    logger.info({ port: env.port, env: env.nodeEnv }, '🚀 LocalBot backend running');

    // Start cron jobs
    startSuspendExpiredJob();

    // Verify DB connection on startup
    await prisma.$connect();
    logger.info('Database connected');

  } catch (err) {
    logger.error({ err: err.message }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
