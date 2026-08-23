const router = require('express').Router({ mergeParams: true });
const reviewController = require('./controllers');
const { requireAuth } = require('../../middleware/auth');
const { requireWorkspaceRole } = require('../../middleware/access');
const { validateBody } = require('../../middleware/validate');
const { gradeFlashcardSchema } = require('./validation');

router.get('/queue', requireAuth, requireWorkspaceRole('VIEWER'), reviewController.getQueue);
router.get('/stats', requireAuth, requireWorkspaceRole('VIEWER'), reviewController.getStats);
router.post(
  '/:flashcardId',
  requireAuth,
  requireWorkspaceRole('VIEWER'),
  validateBody(gradeFlashcardSchema),
  reviewController.gradeFlashcard
);

module.exports = router;
