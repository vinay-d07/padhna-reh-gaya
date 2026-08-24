const sessionsService = require('./services');
const asyncHandler = require('../../lib/asyncHandler');

const start = asyncHandler(async (req, res) => {
  const { roomId } = req.body;
  const session = await sessionsService.startSession({ userId: req.dbUser.id, roomId });
  return res.status(201).json({ success: true, message: 'Study session started', data: session });
});

const end = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await sessionsService.endSessionById(sessionId, req.dbUser.id);
  return res.status(200).json({ success: true, message: 'Study session ended', data: session });
});

const getActive = asyncHandler(async (req, res) => {
  const session = await sessionsService.getActiveSession(req.dbUser.id);
  return res.status(200).json({ success: true, data: session });
});

const list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const sessions = await sessionsService.listSessionsForUser(req.dbUser.id, { page, limit });
  return res.status(200).json({ success: true, data: sessions });
});

module.exports = { start, end, getActive, list };
