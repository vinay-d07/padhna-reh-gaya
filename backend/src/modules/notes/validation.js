const { z } = require('zod');

const createNoteSchema = z.object({
  title: z.string().trim().max(200).optional(),
  content: z.any().optional(),
  // Set when a note is created from a chat message ("Save as note") — see
  // notes/services.js createNote, which verifies it belongs to the same
  // workspace rather than trusting it outright.
  conversationId: z.string().trim().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().trim().min(1, 'title cannot be empty').max(200).optional(),
  content: z.any().optional(),
});

module.exports = { createNoteSchema, updateNoteSchema };
