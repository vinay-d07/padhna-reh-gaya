const { Server } = require('socket.io');
const { verifyToken } = require('@clerk/express');
const userRepo = require('../modules/users/repo');
const logger = require('./logger');

let io;

function roomChannel(roomId) {
  return `room:${roomId}`;
}

// Socket.io's handshake is a normal HTTP request, but it doesn't go through
// clerkMiddleware()/getAuth() like REST routes do — the client sends its
// Clerk session token explicitly in `socket.handshake.auth.token` (see
// client/features/rooms/socket.js) and we verify it the same way
// middleware/auth.js verifies REST requests, just via the lower-level
// verifyToken() instead of the Express-request-shaped getAuth().
async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const { sub: clerkId } = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    const user = await userRepo.findUserByClerkId(clerkId);
    if (!user) {
      return next(new Error('User not found'));
    }
    socket.data.user = user;
    next();
  } catch (error) {
    logger.warn({ err: error }, 'socket authentication failed');
    next(new Error('Authentication failed'));
  }
}

// Called once from index.js with the shared http.Server so Socket.io can
// upgrade connections on the same port the REST API listens on.
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    require('../modules/rooms/socketHandlers').registerRoomHandlers(io, socket);
  });

  return io;
}

// Modules that already know a state change was persisted (e.g. after a
// REST handler writes to Mongo) use this to push the update live — see the
// "Real-time architecture" note in rooms.md: sockets only ever broadcast,
// they never carry a write themselves.
function emitToRoom(roomId, event, payload) {
  if (!io) return;
  io.to(roomChannel(roomId)).emit(event, payload);
}

function getIo() {
  return io;
}

module.exports = { initSocket, emitToRoom, getIo, roomChannel };
