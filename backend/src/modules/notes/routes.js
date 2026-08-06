const express = require('express');
const notesController = require('./controllers');
const { requireAuth } = require('../../middleware/auth');
const { requireWorkspaceRole, requireNoteRole } = require('../../middleware/access');

// Mounted at /workspaces/:workspaceId/notes
const workspaceScoped = express.Router({ mergeParams: true });
workspaceScoped.get('/', requireAuth, requireWorkspaceRole('VIEWER'), notesController.list);
workspaceScoped.post('/', requireAuth, requireWorkspaceRole('EDITOR'), notesController.create);

// Mounted at /notes
const standalone = express.Router();
standalone.patch('/:noteId', requireAuth, requireNoteRole('EDITOR'), notesController.update);
standalone.delete('/:noteId', requireAuth, requireNoteRole('EDITOR'), notesController.remove);

module.exports = { workspaceScoped, standalone };
