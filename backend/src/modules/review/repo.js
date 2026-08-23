const prisma = require('../../lib/prisma');

async function findReadyDocumentIds(workspaceId) {
  const documents = await prisma.document.findMany({
    where: { workspaceId, status: 'READY', deletedAt: { isSet: false } },
    select: { id: true, title: true },
  });
  return documents;
}

async function findFlashcardsByDocumentIds(documentIds) {
  return await prisma.flashcard.findMany({
    where: { documentId: { in: documentIds } },
    orderBy: { order: 'asc' },
  });
}

async function findProgressForUser(flashcardIds, userId) {
  return await prisma.flashcardProgress.findMany({
    where: { flashcardId: { in: flashcardIds }, userId },
  });
}

async function findDueProgressForUser(userId, flashcardIds, before) {
  return await prisma.flashcardProgress.findMany({
    where: { userId, flashcardId: { in: flashcardIds }, dueDate: { lte: before } },
    orderBy: { dueDate: 'asc' },
  });
}

async function countDueForUser(userId, before) {
  return await prisma.flashcardProgress.count({
    where: { userId, dueDate: { lte: before } },
  });
}

async function findFlashcardById(id) {
  return await prisma.flashcard.findUnique({ where: { id } });
}

async function upsertProgress(flashcardId, userId, state) {
  return await prisma.flashcardProgress.upsert({
    where: { flashcardId_userId: { flashcardId, userId } },
    update: { ...state, lastReviewedAt: new Date() },
    create: { flashcardId, userId, ...state, lastReviewedAt: new Date() },
  });
}

module.exports = {
  findReadyDocumentIds,
  findFlashcardsByDocumentIds,
  findProgressForUser,
  findDueProgressForUser,
  countDueForUser,
  findFlashcardById,
  upsertProgress,
};
