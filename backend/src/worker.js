require('dotenv').config();
const logger = require('./lib/logger');
const { startIngestionWorker } = require('./jobs/ingestionWorker');
const { startSessionSweeperWorker } = require('./jobs/sessionSweeper');
const { scheduleSessionSweep } = require('./lib/queue');

const worker = startIngestionWorker();
logger.info('Ingestion worker listening for jobs');

const sessionSweeperWorker = startSessionSweeperWorker();
scheduleSessionSweep().catch((error) => logger.error({ err: error }, 'failed to schedule session sweep'));
logger.info('Session sweeper listening for jobs');

async function shutdown(signal) {
  logger.info({ signal }, 'Ingestion worker shutting down');
  await worker.close();
  await sessionSweeperWorker.close();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
