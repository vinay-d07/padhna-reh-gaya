import { describe, it, expect, vi, afterEach } from 'vitest';

// Plain require() (not `import`) so this resolves through Node's own module
// cache to the exact same object services.js's own require('./repo') and
// require('../../lib/queue') get — see workspaces/services.test.js for why
// an ESM import wouldn't work here. lib/supabase.js's real client is left
// alone (dummy creds come from vitest.config.js `test.env`); retryIngestion
// never calls it. lib/queue's enqueueIngestion is spied on so this test
// never opens a real Redis connection.
const uploadsRepo = require('./repo');
const queue = require('../../lib/queue');
const dashboardService = require('../dashboard/services');
const { retryIngestion, generateQuiz, getQuiz, submitQuizAttempt } = require('./services');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('retryIngestion', () => {
  it('rejects when the document does not exist', async () => {
    vi.spyOn(uploadsRepo, 'findDocumentById').mockResolvedValue(null);
    await expect(retryIngestion('ws_1', 'doc_1')).rejects.toThrow('Document not found');
  });

  it('rejects when the document belongs to a different workspace', async () => {
    vi.spyOn(uploadsRepo, 'findDocumentById').mockResolvedValue({
      id: 'doc_1',
      workspaceId: 'ws_other',
      status: 'FAILED',
    });
    await expect(retryIngestion('ws_1', 'doc_1')).rejects.toThrow('Document not found');
  });

  it('rejects when the document is not currently FAILED', async () => {
    vi.spyOn(uploadsRepo, 'findDocumentById').mockResolvedValue({
      id: 'doc_1',
      workspaceId: 'ws_1',
      status: 'READY',
    });
    await expect(retryIngestion('ws_1', 'doc_1')).rejects.toThrow('Only a failed document can be retried');
  });

  it('resets status/progress and re-enqueues ingestion for a FAILED document', async () => {
    const doc = {
      id: 'doc_1',
      workspaceId: 'ws_1',
      status: 'FAILED',
      storageKey: 'ws_1/file.pdf',
      mimeType: 'application/pdf',
      vectorNamespace: 'doc_ns',
      title: 'My Doc',
      fileName: 'file.pdf',
    };
    vi.spyOn(uploadsRepo, 'findDocumentById').mockResolvedValue(doc);
    const updateSpy = vi.spyOn(uploadsRepo, 'updateDocumentStatus').mockResolvedValue({});
    const enqueueSpy = vi.spyOn(queue, 'enqueueIngestion').mockResolvedValue(undefined);

    const result = await retryIngestion('ws_1', 'doc_1');

    expect(updateSpy).toHaveBeenCalledWith('doc_1', {
      status: 'PROCESSING',
      ingestProgress: 0,
      errorMessage: null,
    });
    expect(enqueueSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 'doc_1',
        storageKey: doc.storageKey,
        mimeType: doc.mimeType,
        vectorNamespace: doc.vectorNamespace,
      })
    );
    expect(result.status).toBe('PROCESSING');
    expect(result.ingestProgress).toBe(0);
  });
});

const READY_DOC = {
  id: 'doc_1',
  workspaceId: 'ws_1',
  status: 'READY',
  vectorNamespace: 'doc_ns',
  title: 'My Doc',
};

describe('generateQuiz', () => {
  it('rejects when the document is still processing', async () => {
    vi.spyOn(uploadsRepo, 'findDocumentById').mockResolvedValue({ ...READY_DOC, status: 'PROCESSING' });
    await expect(
      generateQuiz({ workspaceId: 'ws_1', documentId: 'doc_1', userId: 'user_1', count: 5 })
    ).rejects.toThrow('Document is still processing');
  });
});

describe('getQuiz', () => {
  it('rejects when no quiz has been generated yet', async () => {
    vi.spyOn(uploadsRepo, 'findDocumentById').mockResolvedValue(READY_DOC);
    vi.spyOn(uploadsRepo, 'findQuizByDocumentId').mockResolvedValue(null);
    await expect(getQuiz('ws_1', 'doc_1')).rejects.toThrow('Quiz not found');
  });
});

describe('submitQuizAttempt', () => {
  const QUIZ = {
    id: 'quiz_1',
    questions: [
      { question: 'Q1', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: 'E1' },
      { question: 'Q2', options: ['A', 'B', 'C', 'D'], correctIndex: 3, explanation: 'E2' },
    ],
  };

  it('grades answers server-side and records a QUIZ_COMPLETED activity', async () => {
    vi.spyOn(uploadsRepo, 'findDocumentById').mockResolvedValue(READY_DOC);
    vi.spyOn(uploadsRepo, 'findQuizByDocumentId').mockResolvedValue(QUIZ);
    const activitySpy = vi.spyOn(dashboardService, 'recordActivity').mockResolvedValue({});

    const result = await submitQuizAttempt({
      workspaceId: 'ws_1',
      documentId: 'doc_1',
      userId: 'user_1',
      answers: [1, 0],
    });

    expect(result.score).toBe(1);
    expect(result.total).toBe(2);
    expect(result.results[0].correct).toBe(true);
    expect(result.results[1].correct).toBe(false);
    expect(activitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        workspaceId: 'ws_1',
        type: 'QUIZ_COMPLETED',
        metadata: expect.objectContaining({ documentId: 'doc_1', score: 1, total: 2 }),
      })
    );
  });

  it('rejects when the document belongs to a different workspace', async () => {
    vi.spyOn(uploadsRepo, 'findDocumentById').mockResolvedValue({ ...READY_DOC, workspaceId: 'ws_other' });
    await expect(
      submitQuizAttempt({ workspaceId: 'ws_1', documentId: 'doc_1', userId: 'user_1', answers: [0] })
    ).rejects.toThrow('Document not found');
  });
});
