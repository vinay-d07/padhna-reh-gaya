const express = require('express');
const chatController = require('./controllers');
const { requireAuth } = require('../../middleware/auth');
const { requireWorkspaceRole, requireConversationRole } = require('../../middleware/access');
const { validateBody } = require('../../middleware/validate');
const { createConversationSchema, sendMessageSchema } = require('./validation');

// Mounted at /workspaces/:workspaceId/conversations
const workspaceScoped = express.Router({ mergeParams: true });
workspaceScoped.get('/', requireAuth, requireWorkspaceRole('VIEWER'), chatController.listConversations);
workspaceScoped.post(
  '/',
  requireAuth,
  requireWorkspaceRole('EDITOR'),
  validateBody(createConversationSchema),
  chatController.createConversation
);

// Mounted at /conversations
const standalone = express.Router();
standalone.get(
  '/:conversationId/messages',
  requireAuth,
  requireConversationRole('VIEWER'),
  chatController.listMessages
);
standalone.post(
  '/:conversationId/messages',
  requireAuth,
  requireConversationRole('EDITOR'),
  validateBody(sendMessageSchema),
  chatController.sendMessage
);

module.exports = { workspaceScoped, standalone };
