const prisma = require('../../lib/prisma');

async function createRoom({ name, description, createdById, isPrivate, joinCode }) {
  return await prisma.studyRoom.create({
    data: { name, description, createdById, isPrivate, joinCode },
  });
}

// The public lobby only ever lists open rooms — a private room is reachable
// only via its direct link + join code (see rooms/services.js joinRoom).
async function findPublicRooms() {
  return await prisma.studyRoom.findMany({
    where: { deletedAt: { isSet: false }, isPrivate: false },
    orderBy: { createdAt: 'desc' },
  });
}

async function findRoomById(id) {
  return await prisma.studyRoom.findFirst({ where: { id, deletedAt: { isSet: false } } });
}

// Powers "join with a code" from the lobby, without already knowing the
// room's id — see rooms/services.js lookupRoomByCode.
async function findRoomByCode(code) {
  return await prisma.studyRoom.findFirst({
    where: { joinCode: code, deletedAt: { isSet: false } },
  });
}

async function softDeleteRoom(id) {
  return await prisma.studyRoom.update({ where: { id }, data: { deletedAt: new Date() } });
}

async function countActiveParticipants(roomId) {
  return await prisma.roomParticipant.count({ where: { roomId, leftAt: null } });
}

async function findActiveParticipantsByRoom(roomId) {
  return await prisma.roomParticipant.findMany({
    where: { roomId, leftAt: null },
    include: { user: { select: { id: true, name: true, imageUrl: true } } },
    orderBy: { joinedAt: 'asc' },
  });
}

async function findParticipant(roomId, userId) {
  return await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
}

async function upsertParticipant(roomId, userId, topic) {
  return await prisma.roomParticipant.upsert({
    where: { roomId_userId: { roomId, userId } },
    update: { leftAt: null, joinedAt: new Date(), topic: topic ?? null },
    create: { roomId, userId, topic: topic ?? null },
  });
}

async function markParticipantLeft(roomId, userId) {
  return await prisma.roomParticipant.updateMany({
    where: { roomId, userId, leftAt: null },
    data: { leftAt: new Date() },
  });
}

// Participants still marked "present" long after they joined — the sweeper
// (jobs/sessionSweeper.js) runs in a separate `worker` process from the
// Socket.io server, so it has no way to check live socket connections; a
// generous joinedAt cutoff is the honest fallback for "disconnect never
// fired" (crash, lost power) rather than a real presence check.
async function findStaleParticipants(cutoff) {
  return await prisma.roomParticipant.findMany({
    where: { leftAt: null, joinedAt: { lt: cutoff } },
  });
}

async function createMessage({ roomId, userId, content }) {
  return await prisma.roomMessage.create({
    data: { roomId, userId, content },
    include: { user: { select: { id: true, name: true, imageUrl: true } } },
  });
}

async function findRecentMessages(roomId, limit) {
  const messages = await prisma.roomMessage.findMany({
    where: { roomId },
    include: { user: { select: { id: true, name: true, imageUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return messages.reverse();
}

async function findMessageById(id) {
  return await prisma.roomMessage.findUnique({ where: { id } });
}

async function setMessageReactions(id, reactions) {
  return await prisma.roomMessage.update({ where: { id }, data: { reactions } });
}

// A handful of avatars per lobby card, not the full room — see
// rooms/services.js listRooms.
async function findRecentParticipantsPreview(roomId, limit) {
  return await prisma.roomParticipant.findMany({
    where: { roomId, leftAt: null },
    include: { user: { select: { id: true, name: true, imageUrl: true } } },
    orderBy: { joinedAt: 'asc' },
    take: limit,
  });
}

module.exports = {
  createRoom,
  findPublicRooms,
  findRoomById,
  findRoomByCode,
  softDeleteRoom,
  countActiveParticipants,
  findActiveParticipantsByRoom,
  findParticipant,
  upsertParticipant,
  markParticipantLeft,
  findStaleParticipants,
  createMessage,
  findRecentMessages,
  findMessageById,
  setMessageReactions,
  findRecentParticipantsPreview,
};
