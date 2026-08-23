const { z } = require('zod');

const signupSchema = z.object({
  email: z.string().trim().email('a valid email is required'),
  name: z.string().trim().optional(),
  imageUrl: z.string().trim().url().optional(),
});

module.exports = { signupSchema };
