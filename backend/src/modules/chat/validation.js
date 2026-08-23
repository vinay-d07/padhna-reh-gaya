const { z } = require('zod');

const createConversationSchema = z.object({
  title: z.string().trim().max(200).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'content is required'),
});

module.exports = { createConversationSchema, sendMessageSchema };
