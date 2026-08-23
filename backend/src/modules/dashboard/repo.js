const prisma = require('../../lib/prisma');

const STREAK_ACTIVITY_TYPES = [
  'DOCUMENT_UPLOADED',
  'MESSAGE_SENT',
  'FLASHCARD_REVIEWED',
  'QUIZ_COMPLETED',
];

async function recordActivity({ userId, workspaceId, type, metadata }) {
  return await prisma.activity.create({
    data: { userId, workspaceId, type, metadata },
  });
}

// Only the activity types that should count toward a study streak/heatmap
// (uploading a document or asking a question) — not every Activity row.
async function findStreakActivitiesSince(userId, since) {
  return await prisma.activity.findMany({
    where: {
      userId,
      type: { in: STREAK_ACTIVITY_TYPES },
      createdAt: { gte: since },
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

// Progress rows are already scoped to the owning user, so this needs no
// workspace join — it's every card due across every workspace they're in.
async function countDueFlashcards(userId) {
  return await prisma.flashcardProgress.count({
    where: { userId, dueDate: { lte: new Date() } },
  });
}

module.exports = {
  recordActivity,
  findStreakActivitiesSince,
  countDueFlashcards,
};
