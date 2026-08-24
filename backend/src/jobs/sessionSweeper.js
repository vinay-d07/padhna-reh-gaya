const { Worker } = require('bullmq');
const connection = require('../lib/redis');
const { SESSION_SWEEP_QUEUE } = require('../lib/queue');
const sessionsRepo = require('../modules/studySessions/repo');
const sessionsService = require('../modules/studySessions/services');
const roomsRepo = require('../modules/rooms/repo');
const roomsService = require('../modules/rooms/services');
const logger = require('../lib/logger');

// Caps for "abandoned" state — see rooms.md "Cleanup / robustness". A
// disconnect handler covers the normal tab-close case; this is the backstop
// for a crash/lost-power that never fired it.
const STALE_SESSION_HOURS = 6;
const STALE_PARTICIPANT_HOURS = 12;

async function sweepStaleSessions() {
  const cutoff = new Date(Date.now() - STALE_SESSION_HOURS * 60 * 60 * 1000);
  const stale = await sessionsRepo.findStaleActiveSessions(cutoff);
  for (const session of stale) {
    await sessionsService.endSessionById(session.id, session.userId).catch((error) => {
      logger.warn({ err: error, sessionId: session.id }, 'failed to auto-end stale study session');
    });
  }
  return stale.length;
}

async function sweepStaleParticipants() {
  const cutoff = new Date(Date.now() - STALE_PARTICIPANT_HOURS * 60 * 60 * 1000);
  const stale = await roomsRepo.findStaleParticipants(cutoff);
  for (const participant of stale) {
    await roomsService.leaveRoom({ roomId: participant.roomId, userId: participant.userId }).catch((error) => {
      logger.warn({ err: error, roomId: participant.roomId }, 'failed to auto-remove stale room participant');
    });
  }
  return stale.length;
}

async function runSweep() {
  const [sessionsClosed, participantsRemoved] = await Promise.all([
    sweepStaleSessions(),
    sweepStaleParticipants(),
  ]);
  if (sessionsClosed || participantsRemoved) {
    logger.info({ sessionsClosed, participantsRemoved }, 'session sweeper ran');
  }
}

// Runs in the `worker` process (see worker.js / the `worker` service in
// docker-compose.yml), on the same BullMQ+Redis stack already backing
// document ingestion — see lib/queue.js `scheduleSessionSweep`.
function startSessionSweeperWorker() {
  return new Worker(SESSION_SWEEP_QUEUE, runSweep, { connection });
}

module.exports = { startSessionSweeperWorker, runSweep };
