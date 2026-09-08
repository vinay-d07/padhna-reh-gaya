const prisma = require('../../lib/prisma');

async function createDocument(data) {
  return await prisma.document.create({ data });
}

async function findDocumentsByWorkspaceId(workspaceId) {
  return await prisma.document.findMany({
    where: { workspaceId, deletedAt: { isSet: false } },
    orderBy: { createdAt: 'desc' },
  });
}

async function findDocumentById(id) {
  return await prisma.document.findFirst({
    where: { id, deletedAt: { isSet: false } },
  });
}

async function softDeleteDocument(id) {
  return await prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// Deliberately does NOT filter out soft-deleted documents — used to look one
// up specifically in order to restore it.
async function findDocumentByIdIncludingDeleted(id) {
  return await prisma.document.findUnique({ where: { id } });
}

async function restoreDocument(id) {
  // `unset` (not `deletedAt: null`) so the field goes back to being absent —
  // matching the `isSet: false` filter every list/find query uses.
  return await prisma.document.update({
    where: { id },
    data: { deletedAt: { unset: true } },
  });
}

async function updateDocumentStatus(id, data) {
  return await prisma.document.update({
    where: { id },
    data,
  });
}

async function findSummaryByDocumentId(documentId) {
  return await prisma.summary.findUnique({ where: { documentId } });
}

async function upsertSummary(documentId, { content, model }) {
  return await prisma.summary.upsert({
    where: { documentId },
    update: { content, model },
    create: { documentId, content, model },
  });
}

async function findFlashcardsByDocumentId(documentId) {
  return await prisma.flashcard.findMany({
    where: { documentId },
    orderBy: { order: 'asc' },
  });
}

// Regenerating flashcards replaces the previous set rather than appending —
// Mongo has no cross-collection transaction here by default, but delete-then
// -create is fine since flashcards are disposable/regeneratable.
async function replaceFlashcards(documentId, cards) {
  await prisma.flashcard.deleteMany({ where: { documentId } });
  if (cards.length === 0) return [];
  await prisma.flashcard.createMany({
    data: cards.map((card, i) => ({ documentId, ...card, order: i })),
  });
  return await findFlashcardsByDocumentId(documentId);
}

async function findQuizByDocumentId(documentId) {
  return await prisma.quiz.findUnique({ where: { documentId } });
}

async function upsertQuiz(documentId, questions) {
  return await prisma.quiz.upsert({
    where: { documentId },
    update: { questions },
    create: { documentId, questions },
  });
}

module.exports = {
  createDocument,
  findDocumentsByWorkspaceId,
  findDocumentById,
  softDeleteDocument,
  findDocumentByIdIncludingDeleted,
  restoreDocument,
  updateDocumentStatus,
  findSummaryByDocumentId,
  upsertSummary,
  findFlashcardsByDocumentId,
  replaceFlashcards,
  findQuizByDocumentId,
  upsertQuiz,
};
