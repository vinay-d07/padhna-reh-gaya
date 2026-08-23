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

module.exports = { INGESTION_QUEUE, ingestionQueue, enqueueIngestion };
