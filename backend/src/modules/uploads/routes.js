const router = require('express').Router({ mergeParams: true });
const uploadsController = require('./controllers');
const { requireAuth } = require('../../middleware/auth');
const { requireWorkspaceRole } = require('../../middleware/access');
const { validateBody } = require('../../middleware/validate');
const {
  uploadDocumentSchema,
  generateFlashcardsSchema,
  generateQuizSchema,
  submitQuizAttemptSchema,
} = require('./validation');

router.get('/', requireAuth, requireWorkspaceRole('VIEWER'), uploadsController.list);
router.post(
  '/',
  requireAuth,
  requireWorkspaceRole('EDITOR'),
  uploadsController.handleUpload,
  validateBody(uploadDocumentSchema),
  uploadsController.create
);
router.delete('/:documentId', requireAuth, requireWorkspaceRole('EDITOR'), uploadsController.remove);
router.post(
  '/:documentId/retry',
  requireAuth,
  requireWorkspaceRole('EDITOR'),
  uploadsController.retryIngestion
);

router.get(
  '/:documentId/summary',
  requireAuth,
  requireWorkspaceRole('VIEWER'),
  uploadsController.getSummary
);
router.post(
  '/:documentId/summary',
  requireAuth,
  requireWorkspaceRole('EDITOR'),
  uploadsController.generateSummary
);
router.get(
  '/:documentId/flashcards',
  requireAuth,
  requireWorkspaceRole('VIEWER'),
  uploadsController.getFlashcards
);
router.post(
  '/:documentId/flashcards',
  requireAuth,
  requireWorkspaceRole('EDITOR'),
  validateBody(generateFlashcardsSchema),
  uploadsController.generateFlashcards
);

router.get(
  '/:documentId/quiz',
  requireAuth,
  requireWorkspaceRole('VIEWER'),
  uploadsController.getQuiz
);
router.post(
  '/:documentId/quiz',
  requireAuth,
  requireWorkspaceRole('EDITOR'),
  validateBody(generateQuizSchema),
  uploadsController.generateQuiz
);
router.post(
  '/:documentId/quiz/attempts',
  requireAuth,
  requireWorkspaceRole('VIEWER'),
  validateBody(submitQuizAttemptSchema),
  uploadsController.submitQuizAttempt
);

module.exports = router;
