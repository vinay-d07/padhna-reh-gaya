const reviewService = require('./services');
const asyncHandler = require('../../lib/asyncHandler');

const MAX_QUEUE_LIMIT = 50;

const getQueue = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const parsedLimit = Number(req.query.limit);
  const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), MAX_QUEUE_LIMIT) : undefined;

  const queue = await reviewService.getQueue({ workspaceId, userId: req.dbUser.id, limit });
  return res.status(200).json({ success: true, data: queue });
});

const getStats = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const stats = await reviewService.getStats({ workspaceId, userId: req.dbUser.id });
  return res.status(200).json({ success: true, data: stats });
});

const gradeFlashcard = asyncHandler(async (req, res) => {
  const { workspaceId, flashcardId } = req.params;
  const { grade } = req.body;
  const progress = await reviewService.gradeFlashcard({
    workspaceId,
    flashcardId,
    userId: req.dbUser.id,
    grade,
  });
  return res.status(200).json({ success: true, data: progress });
});

module.exports = { getQueue, getStats, gradeFlashcard };
