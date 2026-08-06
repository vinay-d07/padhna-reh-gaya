const router = require('express').Router({ mergeParams: true });
const uploadsController = require('./controllers');
const { requireAuth } = require('../../middleware/auth');
const { requireWorkspaceRole } = require('../../middleware/access');

router.get('/', requireAuth, requireWorkspaceRole('VIEWER'), uploadsController.list);
router.post(
  '/',
  requireAuth,
  requireWorkspaceRole('EDITOR'),
  uploadsController.handleUpload,
  uploadsController.create
);
router.delete('/:documentId', requireAuth, requireWorkspaceRole('EDITOR'), uploadsController.remove);

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
  uploadsController.generateFlashcards
);

module.exports = router;
