const { z } = require('zod');
const { GRADES } = require('../../lib/spacedRepetition');

const gradeFlashcardSchema = z.object({
  grade: z.enum(GRADES),
});

module.exports = { gradeFlashcardSchema };
