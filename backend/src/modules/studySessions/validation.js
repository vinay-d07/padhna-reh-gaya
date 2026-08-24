const { z } = require('zod');

const startSessionSchema = z.object({
  roomId: z.string().trim().min(1).optional(),
});

module.exports = { startSessionSchema };
