// jobs/suspend-expired.js
// Runs daily. Suspends tenants whose trial period has expired.
// Uses node-cron for scheduling within the same Node.js process.

import cron from 'node-cron';
import prisma from '../shared/db.js';
import logger from '../shared/logger.js';

export function startSuspendExpiredJob() {
  // Run every day at 00:05 to give a small buffer after midnight
  cron.schedule('5 0 * * *', async () => {
    logger.info('Running suspend-expired-trials job');
    try {
      const result = await prisma.tenant.updateMany({
        where: {
          status: 'TRIAL',
          trialEnd: { lt: new Date() },
        },
        data: { status: 'SUSPENDED' },
      });

      if (result.count > 0) {
        logger.info({ count: result.count }, 'Tenants suspended due to trial expiry');
      } else {
        logger.info('No tenants to suspend');
      }
    } catch (err) {
      logger.error({ err: err.message }, 'Error in suspend-expired-trials job');
    }
  });

  logger.info('suspend-expired-trials job scheduled (daily at 00:05)');
}
