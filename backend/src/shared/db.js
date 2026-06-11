// shared/db.js
// Singleton PrismaClient instance. Import this everywhere; never new PrismaClient() elsewhere.

import { PrismaClient } from '@prisma/client';
import logger from './logger.js';
import env from '../config/env.js';
import { normalizeDatabaseUrl } from './database-url.js';

const databaseUrl = normalizeDatabaseUrl(env.databaseUrl);

if (databaseUrl.changed) {
  logger.warn({ source: 'prisma', reason: databaseUrl.reason }, 'Normalized DATABASE_URL for startup');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl.url,
    },
  },
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

prisma.$on('warn', (e) => logger.warn({ source: 'prisma' }, e.message));
prisma.$on('error', (e) => logger.error({ source: 'prisma' }, e.message));

export default prisma;
