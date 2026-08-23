const { randomUUID } = require('crypto');
const { supabase, DOCUMENTS_BUCKET, ensureBucket } = require('../../lib/supabase');
const { loadRag } = require('../../lib/rag');
// Called as `queue.enqueueIngestion(...)` rather than destructured so tests
// can vi.spyOn the module's own export instead of hitting a real Redis.
const queue = require('../../lib/queue');
const { AppError } = require('../../lib/errors');
const uploadsRepo = require('./repo');
const workspaceRepo = require('../workspaces/repo');
const userRepo = require('../users/repo');
const dashboardService = require('../dashboard/services');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain',
]);
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

async function uploadDocument({ workspaceId, clerkId, file, title }) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  if (!clerkId) {
    throw new Error('clerkId is required');
  }
  if (!file) {
    throw new Error('file is required');
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new Error('Only PDF, DOCX, PPTX, and TXT files are supported');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds the 25MB size limit');
  }

  const workspace = await workspaceRepo.findWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const uploader = await userRepo.findUserByClerkId(clerkId);
  if (!uploader) {
    throw new Error('User not found');
  }

  await ensureBucket();

  const storageKey = `${workspaceId}/${randomUUID()}-${sanitizeFileName(file.originalname)}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storageKey, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  let document;
  try {
    document = await uploadsRepo.createDocument({
      workspaceId,
      uploadedById: uploader.id,
      title: title?.trim() || file.originalname,
      fileName: file.originalname,
      storageKey,
      mimeType: file.mimetype,
      fileSize: file.size,
      vectorNamespace: `doc_${randomUUID()}`,
      status: 'PROCESSING',
    });
  } catch (dbError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storageKey]);
    throw dbError;
  }

  // Ingestion (parsing, chunking, embedding, upserting into Qdrant) can take
  // a while for large/scanned PDFs — hand it to the background job queue
  // rather than making the caller wait. The document is returned with
  // status PROCESSING and flips to READY/FAILED once the worker settles it
  // (see src/jobs/ingestionWorker.js), with retry+backoff on transient
  // failures and a dead-letter record (the failed BullMQ job) if it never
  // recovers.
  await queue.enqueueIngestion({
    documentId: document.id,
    storageKey,
    mimeType: file.mimetype,
    vectorNamespace: document.vectorNamespace,
    documentTitle: document.title,
    fileName: document.fileName,
  });

  dashboardService
    .recordActivity({
      userId: uploader.id,
      workspaceId,
      type: 'DOCUMENT_UPLOADED',
      metadata: { documentId: document.id },
    })
    .catch((error) => console.error(`Failed to record upload activity for ${uploader.id}:`, error));

  return document;
}

async function retryIngestion(workspaceId, documentId) {
  const document = await uploadsRepo.findDocumentById(documentId);
  if (!document || document.workspaceId !== workspaceId) {
    throw new AppError('Document not found', 404);
  }
  if (document.status !== 'FAILED') {
    throw new AppError('Only a failed document can be retried', 400);
  }

  await uploadsRepo.updateDocumentStatus(documentId, {
    status: 'PROCESSING',
    ingestProgress: 0,
    errorMessage: null,
  });

  await queue.enqueueIngestion({
    documentId: document.id,
    storageKey: document.storageKey,
    mimeType: document.mimeType,
    vectorNamespace: document.vectorNamespace,
    documentTitle: document.title,
    fileName: document.fileName,
  });

  return { ...document, status: 'PROCESSING', ingestProgress: 0, errorMessage: null };
}

async function listDocuments(workspaceId) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }

  const workspace = await workspaceRepo.findWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  return await uploadsRepo.findDocumentsByWorkspaceId(workspaceId);
}

async function deleteDocument(workspaceId, documentId) {
  if (!documentId) {
    throw new Error('document id is required');
  }

  const document = await uploadsRepo.findDocumentById(documentId);
  if (!document || document.workspaceId !== workspaceId) {
    throw new Error('Document not found');
  }

  await supabase.storage.from(DOCUMENTS_BUCKET).remove([document.storageKey]);

  try {
    const { deleteDocumentVectors } = await loadRag();
    await deleteDocumentVectors(document.vectorNamespace);
  } catch (error) {
    console.error(`Failed to delete vectors for document ${documentId}:`, error);
  }

  return await uploadsRepo.softDeleteDocument(documentId);
}

async function assertDocumentReady(workspaceId, documentId) {
  const document = await uploadsRepo.findDocumentById(documentId);
  if (!document || document.workspaceId !== workspaceId) {
    throw new Error('Document not found');
  }
  if (document.status !== 'READY') {
    throw new Error('Document is still processing — try again once it finishes');
  }
  return document;
}

async function generateSummary({ workspaceId, documentId, userId }) {
  const document = await assertDocumentReady(workspaceId, documentId);

  const { generateSummary: generate } = await loadRag();
  const content = await generate({
    collectionName: document.vectorNamespace,
    documentTitle: document.title,
  });

  const summary = await uploadsRepo.upsertSummary(documentId, { content });

  dashboardService
    .recordActivity({ userId, workspaceId, type: 'SUMMARY_GENERATED', metadata: { documentId } })
    .catch((error) => console.error(`Failed to record summary activity for ${userId}:`, error));

  return summary;
}

async function getSummary(workspaceId, documentId) {
  const document = await uploadsRepo.findDocumentById(documentId);
  if (!document || document.workspaceId !== workspaceId) {
    throw new Error('Document not found');
  }
  const summary = await uploadsRepo.findSummaryByDocumentId(documentId);
  if (!summary) {
    throw new Error('Summary not found');
  }
  return summary;
}

async function generateFlashcards({ workspaceId, documentId, userId, count }) {
  const document = await assertDocumentReady(workspaceId, documentId);

  const { generateFlashcards: generate } = await loadRag();
  const cards = await generate({
    collectionName: document.vectorNamespace,
    documentTitle: document.title,
    count,
  });

  const flashcards = await uploadsRepo.replaceFlashcards(documentId, cards);

  dashboardService
    .recordActivity({
      userId,
      workspaceId,
      type: 'FLASHCARDS_GENERATED',
      metadata: { documentId, count: flashcards.length },
    })
    .catch((error) => console.error(`Failed to record flashcards activity for ${userId}:`, error));

  return flashcards;
}

async function getFlashcards(workspaceId, documentId) {
  const document = await uploadsRepo.findDocumentById(documentId);
  if (!document || document.workspaceId !== workspaceId) {
    throw new Error('Document not found');
  }
  return await uploadsRepo.findFlashcardsByDocumentId(documentId);
}

async function generateQuiz({ workspaceId, documentId, userId, count }) {
  const document = await assertDocumentReady(workspaceId, documentId);

  const { generateQuiz: generate } = await loadRag();
  const questions = await generate({
    collectionName: document.vectorNamespace,
    documentTitle: document.title,
    count,
  });

  const quiz = await uploadsRepo.upsertQuiz(documentId, questions);

  dashboardService
    .recordActivity({
      userId,
      workspaceId,
      type: 'QUIZ_GENERATED',
      metadata: { documentId, count: questions.length },
    })
    .catch((error) => console.error(`Failed to record quiz activity for ${userId}:`, error));

  return quiz;
}

async function getQuiz(workspaceId, documentId) {
  const document = await uploadsRepo.findDocumentById(documentId);
  if (!document || document.workspaceId !== workspaceId) {
    throw new Error('Document not found');
  }
  const quiz = await uploadsRepo.findQuizByDocumentId(documentId);
  if (!quiz) {
    throw new Error('Quiz not found');
  }
  return quiz;
}

// Grading happens server-side against the stored questions so a client can
// never inflate its own score — the client only ever sees correctIndex
// inside the returned per-question results, never before submitting.
async function submitQuizAttempt({ workspaceId, documentId, userId, answers }) {
  const document = await uploadsRepo.findDocumentById(documentId);
  if (!document || document.workspaceId !== workspaceId) {
    throw new AppError('Document not found', 404);
  }
  const quiz = await uploadsRepo.findQuizByDocumentId(documentId);
  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  const questions = quiz.questions;
  const results = questions.map((q, i) => {
    const selectedIndex = Number.isInteger(answers[i]) ? answers[i] : null;
    return {
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      selectedIndex,
      correct: selectedIndex === q.correctIndex,
    };
  });
  const score = results.filter((r) => r.correct).length;

  dashboardService
    .recordActivity({
      userId,
      workspaceId,
      type: 'QUIZ_COMPLETED',
      metadata: { documentId, quizId: quiz.id, score, total: questions.length },
    })
    .catch((error) => console.error(`Failed to record quiz completion for ${userId}:`, error));

  return { score, total: questions.length, results };
}

module.exports = {
  uploadDocument,
  listDocuments,
  deleteDocument,
  retryIngestion,
  generateSummary,
  getSummary,
  generateFlashcards,
  getFlashcards,
  generateQuiz,
  getQuiz,
  submitQuizAttempt,
};
