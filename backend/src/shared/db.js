// shared/db.js
// Singleton PrismaClient instance. Import this everywhere; never new PrismaClient() elsewhere.

import { PrismaClient } from '@prisma/client';
import logger from './logger.js';

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

prisma.$on('warn', (e) => logger.warn({ source: 'prisma' }, e.message));
prisma.$on('error', (e) => logger.error({ source: 'prisma' }, e.message));

export default prisma;
