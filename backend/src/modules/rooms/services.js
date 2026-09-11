const crypto = require('crypto');
const roomsRepo = require('./repo');
const sessionsRepo = require('../studySessions/repo');
const sessionsService = require('../studySessions/services');
const { AppError } = require('../../lib/errors');
// Called as `socket.emitToRoom(...)` rather than destructured so tests can
// vi.spyOn the module's own export — see uploads/services.js's `queue` for
// the same reasoning.
const socket = require('../../lib/socket');
const dashboardService = require('../dashboard/services');

const MESSAGE_HISTORY_LIMIT = 50;
const MAX_CODE_GENERATION_ATTEMPTS = 5;
// How many avatars a lobby card shows before falling back to "+N more" —
// see rooms/services.js listRooms.
const LOBBY_PARTICIPANT_PREVIEW_LIMIT = 4;

function randomCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

// Codes aren't DB-uniqueness-constrained (see the schema comment), but
// "join with a code" from the lobby (lookupRoomByCode) needs one code to
// resolve to exactly one room, so check-and-retry here at generation time.
// The keyspace (16^6 ≈ 16.7M) makes a real collision astronomically rare —
// this is a correctness backstop, not something expected to ever loop.
async function generateJoinCode() {
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
    const code = randomCode();
    const existing = await roomsRepo.findRoomByCode(code);
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique room code — try again');
}

async function isMember(roomId, userId, room) {
  if (room.createdById === userId) return true;
  const participant = await roomsRepo.findParticipant(roomId, userId);
  return Boolean(participant);
}

// Throws unless the room is public, the caller already belongs to it, or
// `code` matches the room's joinCode — used by both getRoomDetail and
// listMessages so a private room's chat/presence never leaks to a stranger
// who merely guessed the room's id.
async function assertCanAccess(room, userId, code) {
  if (!room.isPrivate) return;
  if (await isMember(room.id, userId, room)) return;
  if (code && code === room.joinCode) return;
  throw new AppError('This room is private — enter the join code', 403);
}

async function listRooms() {
  const rooms = await roomsRepo.findPublicRooms();
  const [counts, previews] = await Promise.all([
    Promise.all(rooms.map((room) => roomsRepo.countActiveParticipants(room.id))),
    Promise.all(
      rooms.map((room) => roomsRepo.findRecentParticipantsPreview(room.id, LOBBY_PARTICIPANT_PREVIEW_LIMIT))
    ),
  ]);
  return rooms.map((room, i) => ({
    ...room,
    participantCount: counts[i],
    // Just enough to render "who's here" avatars on the lobby card without
    // pulling the room's full participant list (topics, session state) that
    // only the room page itself needs.
    participantsPreview: previews[i].map((p) => ({ userId: p.userId, name: p.user.name, imageUrl: p.user.imageUrl })),
  }));
}

async function createRoom({ name, description, createdById, isPrivate }) {
  const joinCode = isPrivate ? await generateJoinCode() : null;
  return await roomsRepo.createRoom({
    name: name.trim(),
    description: description?.trim(),
    createdById,
    isPrivate: Boolean(isPrivate),
    joinCode,
  });
}

// "Join with a code" from the lobby — resolves a code straight to a room
// id without the caller needing to already have the room's link. Doesn't
// itself grant access (joinRoom still re-validates the code), so it's safe
// to expose to anyone signed in.
async function lookupRoomByCode(code) {
  const room = await roomsRepo.findRoomByCode(code);
  if (!room) {
    throw new AppError('No room found with that code', 404);
  }
  return { id: room.id, name: room.name };
}

// Called both for the "am I allowed in" pre-join check and for the live
// room view. When the caller can't yet access a private room, this returns
// a locked summary (name/description only, no participants, no code)
// instead of throwing — the client uses that to render the join-code
// prompt rather than a hard error page.
async function getRoomDetail(roomId, { requesterId, code } = {}) {
  const room = await roomsRepo.findRoomById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (room.isPrivate && !(await isMember(roomId, requesterId, room)) && code !== room.joinCode) {
    return { id: room.id, name: room.name, description: room.description, isPrivate: true, locked: true };
  }

  const participants = await roomsRepo.findActiveParticipantsByRoom(roomId);
  const activeSessions = await Promise.all(
    participants.map((p) => sessionsRepo.findActiveSessionForUser(p.userId))
  );
  const sessionByUserId = new Map(
    participants.map((p, i) => [p.userId, activeSessions[i]?.roomId === roomId ? activeSessions[i] : null])
  );

  return {
    ...room,
    // Only the creator gets the code back on a normal read — anyone who
    // already joined shouldn't need it again, and it's how they'd re-share
    // an invite.
    joinCode: room.createdById === requesterId ? room.joinCode : undefined,
    locked: false,
    participants: participants.map((p) => ({
      userId: p.userId,
      name: p.user.name,
      imageUrl: p.user.imageUrl,
      joinedAt: p.joinedAt,
      topic: p.topic,
      activeSession: sessionByUserId.get(p.userId)
        ? { id: sessionByUserId.get(p.userId).id, startedAt: sessionByUserId.get(p.userId).startedAt }
        : null,
    })),
  };
}

async function deleteRoom(roomId, userId) {
  const room = await roomsRepo.findRoomById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }
  if (room.createdById !== userId) {
    throw new AppError('Only the room creator can delete this room', 403);
  }
  return await roomsRepo.softDeleteRoom(roomId);
}

async function joinRoom({ roomId, userId, userInfo, code, topic }) {
  const room = await roomsRepo.findRoomById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }
  if (room.isPrivate && !(await isMember(roomId, userId, room)) && code !== room.joinCode) {
    throw new AppError('Invalid join code', 403);
  }

  const participant = await roomsRepo.upsertParticipant(roomId, userId, topic);

  dashboardService
    .recordActivity({ userId, type: 'ROOM_JOINED', metadata: { roomId } })
    .catch((error) => console.error(`Failed to record room-join activity for ${userId}:`, error));

  // Look up whether this user already has a session running in this room
  // (e.g. a reconnect, or a second tab) instead of assuming a fresh join
  // means "not studying yet" — an assumption that was wiping out an
  // already-running timer for everyone else's view whenever this event
  // fired for a user who was, in fact, already studying.
  const activeSession = await sessionsRepo.findActiveSessionForUser(userId);
  const activeSessionView =
    activeSession && activeSession.roomId === roomId
      ? { id: activeSession.id, startedAt: activeSession.startedAt }
      : null;

  socket.emitToRoom(roomId, 'presence:joined', {
    userId,
    name: userInfo?.name,
    imageUrl: userInfo?.imageUrl,
    joinedAt: participant.joinedAt,
    topic: participant.topic,
    activeSession: activeSessionView,
  });

  return participant;
}

async function leaveRoom({ roomId, userId }) {
  await roomsRepo.markParticipantLeft(roomId, userId);

  // A session started in this room is meaningless once its owner has left —
  // close it out the same way the "end session" endpoint would.
  const activeSession = await sessionsRepo.findActiveSessionForUser(userId);
  if (activeSession && activeSession.roomId === roomId) {
    await sessionsService.endSessionById(activeSession.id, userId);
  }

  dashboardService
    .recordActivity({ userId, type: 'ROOM_LEFT', metadata: { roomId } })
    .catch((error) => console.error(`Failed to record room-leave activity for ${userId}:`, error));

  socket.emitToRoom(roomId, 'presence:left', { userId });
}

async function sendMessage({ roomId, userId, content }) {
  const room = await roomsRepo.findRoomById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }
  await assertCanAccess(room, userId, undefined);

  const message = await roomsRepo.createMessage({ roomId, userId, content: content.trim() });
  const view = {
    id: message.id,
    roomId,
    userId,
    name: message.user.name,
    imageUrl: message.user.imageUrl,
    content: message.content,
    reactions: message.reactions ?? {},
    createdAt: message.createdAt,
  };

  socket.emitToRoom(roomId, 'chat:message', view);

  return view;
}

async function listMessages(roomId, { requesterId, code }) {
  const room = await roomsRepo.findRoomById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }
  await assertCanAccess(room, requesterId, code);

  const messages = await roomsRepo.findRecentMessages(roomId, MESSAGE_HISTORY_LIMIT);
  return messages.map((m) => ({
    id: m.id,
    roomId,
    userId: m.userId,
    name: m.user.name,
    imageUrl: m.user.imageUrl,
    content: m.content,
    reactions: m.reactions ?? {},
    createdAt: m.createdAt,
  }));
}

// Toggles the caller's reaction on a message — adds it if they haven't
// reacted with that emoji yet, removes it if they have. Cheap warmth-to-effort
// win on top of the existing chat: no new model, just a Json map on the
// message (see schema.prisma RoomMessage.reactions).
async function reactToMessage({ roomId, messageId, userId, emoji }) {
  const room = await roomsRepo.findRoomById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }
  await assertCanAccess(room, userId, undefined);

  const message = await roomsRepo.findMessageById(messageId);
  if (!message || message.roomId !== roomId) {
    throw new AppError('Message not found', 404);
  }

  const reactions = { ...(message.reactions ?? {}) };
  const reactors = new Set(reactions[emoji] ?? []);
  if (reactors.has(userId)) {
    reactors.delete(userId);
  } else {
    reactors.add(userId);
  }

  if (reactors.size === 0) {
    delete reactions[emoji];
  } else {
    reactions[emoji] = [...reactors];
  }

  await roomsRepo.setMessageReactions(messageId, reactions);

  const payload = { roomId, messageId, reactions };
  socket.emitToRoom(roomId, 'chat:reaction', payload);

  return payload;
}

module.exports = {
  listRooms,
  createRoom,
  lookupRoomByCode,
  getRoomDetail,
  deleteRoom,
  joinRoom,
  leaveRoom,
  sendMessage,
  listMessages,
  reactToMessage,
};
