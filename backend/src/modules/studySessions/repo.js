const prisma = require('../../lib/prisma');

async function createSession({ userId, roomId }) {
  return await prisma.studySession.create({ data: { userId, roomId: roomId ?? null } });
}

async function findActiveSessionForUser(userId) {
  return await prisma.studySession.findFirst({ where: { userId, endedAt: null } });
}

async function findSessionById(id) {
  return await prisma.studySession.findUnique({ where: { id } });
}

async function endSession(id, { endedAt, durationSeconds }) {
  return await prisma.studySession.update({ where: { id }, data: { endedAt, durationSeconds } });
}

async function findSessionsForUser(userId, { skip = 0, take = 20 } = {}) {
  return await prisma.studySession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    skip,
    take,
  });
}

async function sumDurationForUserSince(userId, since) {
  const result = await prisma.studySession.aggregate({
    where: { userId, endedAt: { gte: since } },
    _sum: { durationSeconds: true },
  });
  return result._sum.durationSeconds ?? 0;
}

// Sessions never explicitly ended (crash, lost connection) — see
// jobs/sessionSweeper.js.
async function findStaleActiveSessions(cutoff) {
  return await prisma.studySession.findMany({
    where: { endedAt: null, startedAt: { lt: cutoff } },
  });
}

module.exports = {
  createSession,
  findActiveSessionForUser,
  findSessionById,
  endSession,
  findSessionsForUser,
  sumDurationForUserSince,
  findStaleActiveSessions,
};
