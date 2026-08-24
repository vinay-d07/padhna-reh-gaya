const roomsService = require('./services');
const { roomChannel } = require('../../lib/socket');
const logger = require('../../lib/logger');

// A disconnect that isn't followed by a reconnect within this window is
// treated as "actually left" — short enough that a real close reads as
// prompt, long enough to ride out a WiFi blip or a laptop sleep/wake
// without ending the user's study session. Socket.io's own reconnection
// backoff starts well under this.
const GRACE_PERIOD_MS = 10000;

// How many live sockets a (roomId, userId) pair currently has open — the
// same account can have a room open in two tabs, and closing one of them
// must not end the study session or mark the user absent while the other
// tab is still there. Single-process in-memory state; fine at this scale
// (see lib/socket.js's note on the Redis adapter if that ever changes).
const presenceCounts = new Map();
const pendingLeaves = new Map();

function presenceKey(roomId, userId) {
  return `${roomId}:${userId}`;
}

function cancelPendingLeave(key) {
  const timeout = pendingLeaves.get(key);
  if (timeout) {
    clearTimeout(timeout);
    pendingLeaves.delete(key);
  }
}

// Exported (with the state above) so tests can drive this without a real
// socket.io Server/Socket pair — see socketHandlers.test.js.
function trackEnter(roomId, userId) {
  const key = presenceKey(roomId, userId);
  cancelPendingLeave(key);
  presenceCounts.set(key, (presenceCounts.get(key) || 0) + 1);
}

function trackExit(roomId, userId, { immediate = false } = {}) {
  const key = presenceKey(roomId, userId);
  const remaining = Math.max(0, (presenceCounts.get(key) || 0) - 1);
  if (remaining > 0) {
    presenceCounts.set(key, remaining);
    return;
  }
  presenceCounts.delete(key);
  cancelPendingLeave(key);

  const doLeave = () => {
    pendingLeaves.delete(key);
    roomsService
      .leaveRoom({ roomId, userId })
      .catch((error) => logger.warn({ err: error, roomId }, 'leaveRoom cleanup failed'));
  };

  if (immediate) {
    doLeave();
  } else {
    pendingLeaves.set(key, setTimeout(doLeave, GRACE_PERIOD_MS));
  }
}

// Sockets only subscribe a client to a room's live-update channel — the
// actual join/leave state change is written via the REST endpoints (see
// rooms/controllers.js). `room:enter` re-subscribes on every (re)connect,
// not just the first one — Socket.io does not remember room membership
// across a reconnect (a new connection starts in zero rooms), so without
// this a client that reconnects (an expired auth token, a network blip)
// silently stops receiving any further presence/session/chat events for a
// room it still believes it's in.
function registerRoomHandlers(io, socket) {
  socket.on('room:enter', ({ roomId } = {}) => {
    if (!roomId || !socket.data.user) return;
    socket.join(roomChannel(roomId));
    socket.data.roomId = roomId;
    trackEnter(roomId, socket.data.user.id);
  });

  // Emitted by the client on an intentional leave (navigating away) so it
  // doesn't have to wait out the disconnect grace period below.
  socket.on('room:exit', ({ roomId } = {}) => {
    if (!roomId) return;
    socket.leave(roomChannel(roomId));
    if (socket.data.roomId === roomId) socket.data.roomId = undefined;
    if (socket.data.user) trackExit(roomId, socket.data.user.id, { immediate: true });
  });

  // Covers a tab close / crash / lost connection that never sent
  // room:exit. Grace-period gated (see trackExit) so a transient
  // disconnect-then-reconnect doesn't end the session.
  socket.on('disconnect', () => {
    const { roomId, user } = socket.data;
    if (!roomId || !user) return;
    trackExit(roomId, user.id);
  });
}

module.exports = { registerRoomHandlers, trackEnter, trackExit };
