const { z } = require('zod');

const createRoomSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(80),
  description: z.string().trim().max(300).optional(),
  isPrivate: z.boolean().optional(),
});

const joinRoomSchema = z.object({
  code: z.string().trim().max(20).optional(),
  topic: z.string().trim().max(120).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'content is required').max(1000),
});

module.exports = { createRoomSchema, joinRoomSchema, sendMessageSchema };
