const express = require('express');
const notesController = require('./controllers');

// Mounted at /workspaces/:workspaceId/notes
const workspaceScoped = express.Router({ mergeParams: true });
workspaceScoped.get('/', notesController.list);
workspaceScoped.post('/', notesController.create);

// Mounted at /notes
const standalone = express.Router();
standalone.patch('/:noteId', notesController.update);
standalone.delete('/:noteId', notesController.remove);

module.exports = { workspaceScoped, standalone };
