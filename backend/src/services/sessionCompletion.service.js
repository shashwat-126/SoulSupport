/**
 * Session auto-completion scheduler.
 *
 * Runs every 15 minutes and marks any 'confirmed' session whose end time
 * (sessionDate + durationMinutes) has passed as 'completed', provided
 * neither party has already actioned the session manually.
 *
 * Also expires 'pending' sessions that are more than 1 hour overdue
 * (therapist never confirmed them).
 */
const cron = require('node-cron');
const Session = require('../models/Session.model');
const logger = require('../utils/logger');

async function autoCompleteSessions() {
  const now = new Date();

  try {
    // Auto-complete confirmed sessions whose end time has passed
    const completedResult = await Session.updateMany(
      {
        status: 'confirmed',
        $expr: {
          $lte: [
            {
              $add: [
                '$sessionDate',
                { $multiply: ['$durationMinutes', 60 * 1000] },
              ],
            },
            now,
          ],
        },
      },
      {
        $set: {
          status: 'completed',
          sessionStatusUser: 'completed',
          sessionStatusTherapist: 'completed',
          meetingStatus: 'completed',
        },
      }
    );

    if (completedResult.modifiedCount > 0) {
      logger.info(`Auto-completed ${completedResult.modifiedCount} session(s)`);
    }

    // Expire pending sessions more than 1 hour past their scheduled time
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const expiredResult = await Session.updateMany(
      {
        status: 'pending',
        sessionDate: { $lte: oneHourAgo },
      },
      { $set: { status: 'expired' } }
    );

    if (expiredResult.modifiedCount > 0) {
      logger.info(`Auto-expired ${expiredResult.modifiedCount} pending session(s)`);
    }
  } catch (error) {
    logger.error('Session auto-completion job failed', { error: error.message });
  }
}

function startSessionCompletionJob() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', autoCompleteSessions);
  logger.info('Session auto-completion job scheduled (every 15 min)');
}

module.exports = { startSessionCompletionJob, autoCompleteSessions };
