const { z } = require('zod');

// Runs after multer (handleUpload) so req.body already has the multipart
// text fields — file itself is validated separately in services.js.
const uploadDocumentSchema = z.object({
  title: z.string().trim().max(300).optional(),
});

const generateFlashcardsSchema = z.object({
  count: z.coerce.number().int('count must be a whole number').min(1).max(30).optional(),
});

module.exports = { uploadDocumentSchema, generateFlashcardsSchema };
