const prisma = require('../../lib/prisma');

const STREAK_ACTIVITY_TYPES = ['DOCUMENT_UPLOADED', 'MESSAGE_SENT'];

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

module.exports = {
  recordActivity,
  findStreakActivitiesSince,
};
