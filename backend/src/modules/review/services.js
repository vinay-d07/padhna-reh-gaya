const reviewRepo = require('./repo');
const { schedule, INITIAL_EASE_FACTOR } = require('../../lib/spacedRepetition');
const { AppError } = require('../../lib/errors');
const dashboardService = require('../dashboard/services');

const DEFAULT_QUEUE_LIMIT = 20;
// Cap how many never-reviewed cards get mixed into one session, so a big
// freshly-generated deck doesn't drown out cards that are actually due —
// same idea as Anki's daily new-card limit.
const MAX_NEW_CARDS_PER_SESSION = 10;

function toCardView(flashcard, progress) {
  return {
    id: flashcard.id,
    documentId: flashcard.documentId,
    question: flashcard.question,
    answer: flashcard.answer,
    isNew: !progress,
    easeFactor: progress?.easeFactor ?? INITIAL_EASE_FACTOR,
    repetitions: progress?.repetitions ?? 0,
    intervalDays: progress?.intervalDays ?? 0,
    dueDate: progress?.dueDate ?? null,
    lastReviewedAt: progress?.lastReviewedAt ?? null,
  };
}

async function getQueue({ workspaceId, userId, limit = DEFAULT_QUEUE_LIMIT }) {
  const documents = await reviewRepo.findReadyDocumentIds(workspaceId);
  const documentTitleById = new Map(documents.map((d) => [d.id, d.title]));
  const documentIds = documents.map((d) => d.id);
  if (documentIds.length === 0) {
    return { cards: [], dueCount: 0, newCount: 0 };
  }

  const flashcards = await reviewRepo.findFlashcardsByDocumentIds(documentIds);
  if (flashcards.length === 0) {
    return { cards: [], dueCount: 0, newCount: 0 };
  }

  const flashcardIds = flashcards.map((c) => c.id);
  const flashcardsById = new Map(flashcards.map((c) => [c.id, c]));
  const now = new Date();

  const progressRows = await reviewRepo.findProgressForUser(flashcardIds, userId);
  const progressByFlashcardId = new Map(progressRows.map((p) => [p.flashcardId, p]));

  const dueCards = [];
  const newCards = [];
  for (const card of flashcards) {
    const progress = progressByFlashcardId.get(card.id);
    if (progress) {
      if (progress.dueDate <= now) dueCards.push({ card, progress });
    } else {
      newCards.push({ card, progress: undefined });
    }
  }
  dueCards.sort((a, b) => a.progress.dueDate - b.progress.dueDate);

  const queue = [
    ...dueCards,
    ...newCards.slice(0, MAX_NEW_CARDS_PER_SESSION),
  ].slice(0, limit);

  return {
    cards: queue.map(({ card, progress }) => ({
      ...toCardView(card, progress),
      documentTitle: documentTitleById.get(card.documentId) ?? null,
    })),
    dueCount: dueCards.length,
    newCount: newCards.length,
  };
}

async function getStats({ workspaceId, userId }) {
  const documents = await reviewRepo.findReadyDocumentIds(workspaceId);
  const documentIds = documents.map((d) => d.id);
  if (documentIds.length === 0) {
    return { dueCount: 0 };
  }
  const flashcards = await reviewRepo.findFlashcardsByDocumentIds(documentIds);
  const flashcardIds = flashcards.map((c) => c.id);
  if (flashcardIds.length === 0) {
    return { dueCount: 0 };
  }
  const due = await reviewRepo.findDueProgressForUser(userId, flashcardIds, new Date());
  return { dueCount: due.length };
}

async function gradeFlashcard({ workspaceId, flashcardId, userId, grade }) {
  const flashcard = await reviewRepo.findFlashcardById(flashcardId);
  if (!flashcard) {
    throw new AppError('Flashcard not found', 404);
  }

  const documents = await reviewRepo.findReadyDocumentIds(workspaceId);
  const belongsToWorkspace = documents.some((d) => d.id === flashcard.documentId);
  if (!belongsToWorkspace) {
    throw new AppError('Flashcard not found', 404);
  }

  const [existingProgress] = await reviewRepo.findProgressForUser([flashcardId], userId);
  const next = schedule(existingProgress, grade);
  const progress = await reviewRepo.upsertProgress(flashcardId, userId, next);

  dashboardService
    .recordActivity({
      userId,
      workspaceId,
      type: 'FLASHCARD_REVIEWED',
      metadata: { documentId: flashcard.documentId, flashcardId, grade },
    })
    .catch((error) => console.error(`Failed to record review activity for ${userId}:`, error));

  return progress;
}

module.exports = { getQueue, getStats, gradeFlashcard };
