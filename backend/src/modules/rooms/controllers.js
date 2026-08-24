const roomsService = require('./services');
const asyncHandler = require('../../lib/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const rooms = await roomsService.listRooms();
  return res.status(200).json({ success: true, data: rooms });
});

const create = asyncHandler(async (req, res) => {
  const { name, description, isPrivate } = req.body;
  const room = await roomsService.createRoom({ name, description, isPrivate, createdById: req.dbUser.id });
  return res.status(201).json({ success: true, message: 'Room created', data: room });
});

const lookupByCode = asyncHandler(async (req, res) => {
  const code = String(req.query.code || '')
    .trim()
    .toUpperCase();
  if (!code) {
    return res.status(400).json({ success: false, message: 'code is required' });
  }
  const room = await roomsService.lookupRoomByCode(code);
  return res.status(200).json({ success: true, data: room });
});

const getOne = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const room = await roomsService.getRoomDetail(roomId, {
    requesterId: req.dbUser.id,
    code: req.query.code,
  });
  return res.status(200).json({ success: true, data: room });
});

const remove = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  await roomsService.deleteRoom(roomId, req.dbUser.id);
  return res.status(200).json({ success: true, message: 'Room deleted' });
});

const join = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { code, topic } = req.body;
  const participant = await roomsService.joinRoom({
    roomId,
    userId: req.dbUser.id,
    userInfo: { name: req.dbUser.name, imageUrl: req.dbUser.imageUrl },
    code,
    topic,
  });
  return res.status(200).json({ success: true, data: participant });
});

const leave = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  await roomsService.leaveRoom({ roomId, userId: req.dbUser.id });
  return res.status(200).json({ success: true, message: 'Left room' });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { content } = req.body;
  const message = await roomsService.sendMessage({ roomId, userId: req.dbUser.id, content });
  return res.status(201).json({ success: true, data: message });
});

const listMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const messages = await roomsService.listMessages(roomId, {
    requesterId: req.dbUser.id,
    code: req.query.code,
  });
  return res.status(200).json({ success: true, data: messages });
});

module.exports = { list, create, lookupByCode, getOne, remove, join, leave, sendMessage, listMessages };
