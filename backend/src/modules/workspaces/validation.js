const { z } = require('zod');

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  description: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  color: z.string().trim().optional(),
  coverImage: z.string().trim().optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1, 'name cannot be empty').optional(),
  description: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  color: z.string().trim().optional(),
  coverImage: z.string().trim().optional(),
});

module.exports = { createWorkspaceSchema, updateWorkspaceSchema };
