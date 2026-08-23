const { z } = require('zod');

const createNoteSchema = z.object({
  title: z.string().trim().max(200).optional(),
  content: z.any().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().trim().min(1, 'title cannot be empty').max(200).optional(),
  content: z.any().optional(),
});

module.exports = { createNoteSchema, updateNoteSchema };
