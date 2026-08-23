import { describe, it, expect, vi, afterEach } from 'vitest';

// Plain require() (not `import`) so vi.spyOn intercepts the calls
// services.js's own require('./repo') makes — see uploads/services.test.js.
const reviewRepo = require('./repo');
const dashboardService = require('../dashboard/services');
const { getQueue, getStats, gradeFlashcard } = require('./services');

afterEach(() => {
  vi.restoreAllMocks();
});

const DOC = { id: 'doc_1', title: 'My Doc' };
const CARD_A = { id: 'card_a', documentId: 'doc_1', question: 'Q_A', answer: 'A_A' };
const CARD_B = { id: 'card_b', documentId: 'doc_1', question: 'Q_B', answer: 'A_B' };

describe('getQueue', () => {
  it('returns an empty queue when the workspace has no ready documents', async () => {
    vi.spyOn(reviewRepo, 'findReadyDocumentIds').mockResolvedValue([]);
    const result = await getQueue({ workspaceId: 'ws_1', userId: 'user_1' });
    expect(result).toEqual({ cards: [], dueCount: 0, newCount: 0 });
  });

  it('puts due cards ahead of new cards, sorted by due date', async () => {
    vi.spyOn(reviewRepo, 'findReadyDocumentIds').mockResolvedValue([DOC]);
    vi.spyOn(reviewRepo, 'findFlashcardsByDocumentIds').mockResolvedValue([CARD_A, CARD_B]);
    const pastDue = new Date(Date.now() - 86400000);
    vi.spyOn(reviewRepo, 'findProgressForUser').mockResolvedValue([
      { flashcardId: 'card_a', dueDate: pastDue, easeFactor: 2.5, repetitions: 1 },
    ]);

    const result = await getQueue({ workspaceId: 'ws_1', userId: 'user_1' });

    expect(result.dueCount).toBe(1);
    expect(result.newCount).toBe(1);
    expect(result.cards.map((c) => c.id)).toEqual(['card_a', 'card_b']);
    expect(result.cards[0].isNew).toBe(false);
    expect(result.cards[1].isNew).toBe(true);
  });

  it('excludes not-yet-due cards from the queue', async () => {
    vi.spyOn(reviewRepo, 'findReadyDocumentIds').mockResolvedValue([DOC]);
    vi.spyOn(reviewRepo, 'findFlashcardsByDocumentIds').mockResolvedValue([CARD_A]);
    const futureDue = new Date(Date.now() + 86400000);
    vi.spyOn(reviewRepo, 'findProgressForUser').mockResolvedValue([
      { flashcardId: 'card_a', dueDate: futureDue, easeFactor: 2.5, repetitions: 1 },
    ]);

    const result = await getQueue({ workspaceId: 'ws_1', userId: 'user_1' });
    expect(result.cards).toEqual([]);
    expect(result.dueCount).toBe(0);
  });
});

describe('getStats', () => {
  it('reports 0 due cards when the workspace has no flashcards', async () => {
    vi.spyOn(reviewRepo, 'findReadyDocumentIds').mockResolvedValue([DOC]);
    vi.spyOn(reviewRepo, 'findFlashcardsByDocumentIds').mockResolvedValue([]);
    const result = await getStats({ workspaceId: 'ws_1', userId: 'user_1' });
    expect(result).toEqual({ dueCount: 0 });
  });
});

describe('gradeFlashcard', () => {
  it('rejects when the flashcard does not exist', async () => {
    vi.spyOn(reviewRepo, 'findFlashcardById').mockResolvedValue(null);
    await expect(
      gradeFlashcard({ workspaceId: 'ws_1', flashcardId: 'card_x', userId: 'user_1', grade: 'good' })
    ).rejects.toThrow('Flashcard not found');
  });

  it('rejects when the flashcard belongs to a document outside the workspace', async () => {
    vi.spyOn(reviewRepo, 'findFlashcardById').mockResolvedValue(CARD_A);
    vi.spyOn(reviewRepo, 'findReadyDocumentIds').mockResolvedValue([{ id: 'doc_other', title: 'Other' }]);
    await expect(
      gradeFlashcard({ workspaceId: 'ws_1', flashcardId: 'card_a', userId: 'user_1', grade: 'good' })
    ).rejects.toThrow('Flashcard not found');
  });

  it('schedules the next review, persists progress, and records an activity', async () => {
    vi.spyOn(reviewRepo, 'findFlashcardById').mockResolvedValue(CARD_A);
    vi.spyOn(reviewRepo, 'findReadyDocumentIds').mockResolvedValue([DOC]);
    vi.spyOn(reviewRepo, 'findProgressForUser').mockResolvedValue([]);
    const upsertSpy = vi.spyOn(reviewRepo, 'upsertProgress').mockResolvedValue({ id: 'progress_1' });
    const activitySpy = vi.spyOn(dashboardService, 'recordActivity').mockResolvedValue({});

    const result = await gradeFlashcard({
      workspaceId: 'ws_1',
      flashcardId: 'card_a',
      userId: 'user_1',
      grade: 'good',
    });

    expect(upsertSpy).toHaveBeenCalledWith(
      'card_a',
      'user_1',
      expect.objectContaining({ repetitions: 1, intervalDays: 1 })
    );
    expect(activitySpy).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1', workspaceId: 'ws_1', type: 'FLASHCARD_REVIEWED' })
    );
    expect(result).toEqual({ id: 'progress_1' });
  });
});
