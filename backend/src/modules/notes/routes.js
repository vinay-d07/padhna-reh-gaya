const express = require('express');
const notesController = require('./controllers');
const { requireAuth } = require('../../middleware/auth');
const { requireWorkspaceRole, requireNoteRole } = require('../../middleware/access');
const { validateBody } = require('../../middleware/validate');
const { createNoteSchema, updateNoteSchema } = require('./validation');

// Mounted at /workspaces/:workspaceId/notes
const workspaceScoped = express.Router({ mergeParams: true });
workspaceScoped.get('/', requireAuth, requireWorkspaceRole('VIEWER'), notesController.list);
workspaceScoped.post(
  '/',
  requireAuth,
  requireWorkspaceRole('EDITOR'),
  validateBody(createNoteSchema),
  notesController.create
);

// Mounted at /notes
const standalone = express.Router();
standalone.patch(
  '/:noteId',
  requireAuth,
  requireNoteRole('EDITOR'),
  validateBody(updateNoteSchema),
  notesController.update
);
standalone.delete('/:noteId', requireAuth, requireNoteRole('EDITOR'), notesController.remove);
standalone.post(
  '/:noteId/restore',
  requireAuth,
  requireNoteRole('EDITOR', { includeDeleted: true }),
  notesController.restore
);

module.exports = { workspaceScoped, standalone };
