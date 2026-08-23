const { Worker } = require('bullmq');
const connection = require('../lib/redis');
const { INGESTION_QUEUE } = require('../lib/queue');
const { supabase, DOCUMENTS_BUCKET } = require('../lib/supabase');
const { loadRag } = require('../lib/rag');
const uploadsRepo = require('../modules/uploads/repo');
const logger = require('../lib/logger');

async function processIngestionJob(job) {
  const { documentId, storageKey, mimeType, vectorNamespace, documentTitle, fileName } = job.data;

  await uploadsRepo.updateDocumentStatus(documentId, { status: 'PROCESSING', ingestProgress: 10, errorMessage: null });

  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(storageKey);
  if (error) {
    throw new Error(`Failed to download ${storageKey} from storage: ${error.message}`);
  }
  const buffer = Buffer.from(await data.arrayBuffer());

  await uploadsRepo.updateDocumentStatus(documentId, { ingestProgress: 30 });

  const { ingestDocument } = await loadRag();
  const { pageCount } = await ingestDocument({
    buffer,
    collectionName: vectorNamespace,
    mimeType,
    metadata: { documentId, documentTitle, source: fileName },
  });

  await uploadsRepo.updateDocumentStatus(documentId, {
    status: 'READY',
    pageCount,
    ingestProgress: 100,
    errorMessage: null,
  });
}

// Runs as its own process (see src/worker.js / the `worker` service in
// docker-compose.yml) so a slow/scanned PDF ingestion never blocks the API
// event loop, and so it can be scaled independently of the HTTP server.
function startIngestionWorker() {
  const worker = new Worker(INGESTION_QUEUE, processIngestionJob, {
    connection,
    concurrency: Number(process.env.INGESTION_CONCURRENCY) || 2,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, documentId: job.data.documentId }, 'ingestion completed');
  });

  worker.on('failed', async (job, error) => {
    logger.error(
      { jobId: job?.id, documentId: job?.data?.documentId, attemptsMade: job?.attemptsMade, err: error },
      'ingestion attempt failed'
    );

    const exhausted = job && job.attemptsMade >= (job.opts.attempts || 1);
    if (!exhausted) return;

    // All retries used up — flip the document to FAILED so polling clients
    // stop showing "processing" forever. The job itself stays in BullMQ's
    // failed set (see lib/queue.js removeOnFail) as the dead-letter record;
    // POST /documents/:id/retry re-enqueues a fresh job from there.
    try {
      await uploadsRepo.updateDocumentStatus(job.data.documentId, {
        status: 'FAILED',
        ingestProgress: 0,
        errorMessage: String(error.message || error).slice(0, 500),
      });
    } catch (updateError) {
      logger.error({ err: updateError, documentId: job.data.documentId }, 'failed to mark document FAILED');
    }
  });

  return worker;
}

module.exports = { startIngestionWorker, processIngestionJob };
