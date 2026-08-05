const express = require('express');
const chatController = require('./controllers');

// Mounted at /workspaces/:workspaceId/conversations
const workspaceScoped = express.Router({ mergeParams: true });
workspaceScoped.get('/', chatController.listConversations);
workspaceScoped.post('/', chatController.createConversation);

// Mounted at /conversations
const standalone = express.Router();
standalone.get('/:conversationId/messages', chatController.listMessages);
standalone.post('/:conversationId/messages', chatController.sendMessage);

module.exports = { workspaceScoped, standalone };
