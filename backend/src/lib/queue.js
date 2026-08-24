const { Queue } = require('bullmq');
const connection = require('./redis');

const INGESTION_QUEUE = 'document-ingestion';

const ingestionQueue = new Queue(INGESTION_QUEUE, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 500 },
    // Failed jobs are kept (not removeOnFail) so they double as the
    // dead-letter record — see jobs/ingestionWorker.js for what happens
    // once a job exhausts its retries.
    removeOnFail: { count: 1000 },
  },
});

function enqueueIngestion({ documentId, storageKey, mimeType, vectorNamespace, documentTitle, fileName }) {
  return ingestionQueue.add('ingest', {
    documentId,
    storageKey,
    mimeType,
    vectorNamespace,
    documentTitle,
    fileName,
  });
}

const SESSION_SWEEP_QUEUE = 'session-sweep';
const SESSION_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const sessionSweepQueue = new Queue(SESSION_SWEEP_QUEUE, {
  connection,
  defaultJobOptions: { removeOnComplete: { count: 20 }, removeOnFail: { count: 20 } },
});

// Idempotent — call once on worker startup (see worker.js). BullMQ dedupes
// repeatable jobs by their repeat config, so calling this again on every
// restart doesn't stack up duplicate schedules.
function scheduleSessionSweep() {
  return sessionSweepQueue.add(
    'sweep',
    {},
    { repeat: { every: SESSION_SWEEP_INTERVAL_MS }, jobId: 'session-sweep' }
  );
}

module.exports = {
  INGESTION_QUEUE,
  ingestionQueue,
  enqueueIngestion,
  SESSION_SWEEP_QUEUE,
  sessionSweepQueue,
  scheduleSessionSweep,
};
