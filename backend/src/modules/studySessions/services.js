const sessionsRepo = require('./repo');
const roomsRepo = require('../rooms/repo');
const { AppError } = require('../../lib/errors');
// Called as `socket.emitToRoom(...)` rather than destructured so tests can
// vi.spyOn the module's own export — see rooms/services.js for the same fix.
const socket = require('../../lib/socket');
const dashboardService = require('../dashboard/services');

async function startSession({ userId, roomId }) {
  const existingActive = await sessionsRepo.findActiveSessionForUser(userId);
  if (existingActive) {
    throw new AppError('You already have an active study session', 409);
  }

  if (roomId) {
    const room = await roomsRepo.findRoomById(roomId);
    if (!room) {
      throw new AppError('Room not found', 404);
    }
  }

  const session = await sessionsRepo.createSession({ userId, roomId: roomId ?? null });

  dashboardService
    .recordActivity({ userId, type: 'STUDY_SESSION_STARTED', metadata: { roomId: roomId ?? null } })
    .catch((error) => console.error(`Failed to record session-start activity for ${userId}:`, error));

  if (roomId) {
    socket.emitToRoom(roomId, 'session:started', {
      userId,
      sessionId: session.id,
      startedAt: session.startedAt,
    });
  }

  return session;
}

// Shared by the REST "end session" endpoint, leaveRoom (ending a session
// tied to the room being left), and the sweeper job — idempotent so none of
// those callers need to special-case "already ended" themselves.
async function endSessionById(sessionId, userId) {
  const session = await sessionsRepo.findSessionById(sessionId);
  if (!session || session.userId !== userId) {
    throw new AppError('Study session not found', 404);
  }
  if (session.endedAt) {
    return session;
  }

  const endedAt = new Date();
  const durationSeconds = Math.max(0, Math.round((endedAt - session.startedAt) / 1000));
  const updated = await sessionsRepo.endSession(sessionId, { endedAt, durationSeconds });

  dashboardService
    .recordActivity({
      userId,
      type: 'STUDY_SESSION_ENDED',
      metadata: { roomId: session.roomId, durationSeconds },
    })
    .catch((error) => console.error(`Failed to record session-end activity for ${userId}:`, error));

  if (session.roomId) {
    socket.emitToRoom(session.roomId, 'session:ended', { userId, sessionId, durationSeconds });
  }

  return updated;
}

async function getActiveSession(userId) {
  return await sessionsRepo.findActiveSessionForUser(userId);
}

async function listSessionsForUser(userId, { page = 1, limit = 20 } = {}) {
  return await sessionsRepo.findSessionsForUser(userId, { skip: (page - 1) * limit, take: limit });
}

module.exports = { startSession, endSessionById, getActiveSession, listSessionsForUser };
