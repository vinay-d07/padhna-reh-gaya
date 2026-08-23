require('dotenv').config();
const logger = require('./lib/logger');
const { startIngestionWorker } = require('./jobs/ingestionWorker');

const worker = startIngestionWorker();
logger.info('Ingestion worker listening for jobs');

async function shutdown(signal) {
  logger.info({ signal }, 'Ingestion worker shutting down');
  await worker.close();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
