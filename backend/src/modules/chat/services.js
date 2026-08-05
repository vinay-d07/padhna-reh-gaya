const chatRepo = require('./repo');
const workspaceRepo = require('../workspaces/repo');
const userRepo = require('../users/repo');
const uploadsRepo = require('../uploads/repo');
const dashboardService = require('../dashboard/services');
const { loadRag } = require('../../lib/rag');

const HISTORY_LIMIT = 8;

async function listConversations(workspaceId) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }

  const workspace = await workspaceRepo.findWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  return await chatRepo.findConversationsByWorkspaceId(workspaceId);
}

async function createConversation({ workspaceId, clerkId, title }) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  if (!clerkId) {
    throw new Error('clerkId is required');
  }

  const workspace = await workspaceRepo.findWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const user = await userRepo.findUserByClerkId(clerkId);
  if (!user) {
    throw new Error('User not found');
  }

  return await chatRepo.createConversation({
    workspaceId,
    userId: user.id,
    title: title?.trim() || undefined,
  });
}

async function getMessages(conversationId) {
  if (!conversationId) {
    throw new Error('conversationId is required');
  }

  const conversation = await chatRepo.findConversationById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  return await chatRepo.findMessagesByConversationId(conversationId);
}

// Validated up front (before controllers.js commits to an SSE response) so
// a bad conversationId/clerkId still gets a normal JSON error status.
async function assertConversationAccessible(conversationId, clerkId) {
  if (!conversationId) {
    throw new Error('conversationId is required');
  }
  if (!clerkId) {
    throw new Error('clerkId is required');
  }

  const conversation = await chatRepo.findConversationById(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const user = await userRepo.findUserByClerkId(clerkId);
  if (!user) {
    throw new Error('User not found');
  }

  return { conversation, user };
}

function deriveTitle(content) {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

// Persists the user's message, retrieves context from every READY document
// in the conversation's workspace, streams the LLM's answer token-by-token
// via `onToken`, then persists the assistant's message with its sources.
async function streamMessage({ conversationId, clerkId, content, onToken }) {
  const question = content?.trim();
  if (!question) {
    throw new Error('content is required');
  }

  const { conversation, user } = await assertConversationAccessible(conversationId, clerkId);

  const priorMessages = await chatRepo.findMessagesByConversationId(conversationId);

  await chatRepo.createMessage({
    conversationId,
    role: 'USER',
    content: question,
  });

  dashboardService
    .recordActivity({
      userId: user.id,
      workspaceId: conversation.workspaceId,
      type: 'MESSAGE_SENT',
      metadata: { conversationId },
    })
    .catch((error) => console.error(`Failed to record message activity for ${user.id}:`, error));

  const documents = await uploadsRepo.findDocumentsByWorkspaceId(conversation.workspaceId);
  const collectionNames = documents
    .filter((doc) => doc.status === 'READY')
    .map((doc) => doc.vectorNamespace);

  const chatHistory = priorMessages.slice(-HISTORY_LIMIT).map((m) => ({
    role: m.role === 'ASSISTANT' ? 'assistant' : 'user',
    content: m.content,
  }));

  let answer;
  let sources;
  try {
    const { streamAnswer } = await loadRag();
    ({ answer, sources } = await streamAnswer({
      question,
      collectionNames,
      chatHistory,
      onToken,
    }));
  } catch (error) {
    console.error(`streamAnswer failed for conversation ${conversationId}:`, error);
    answer = "I couldn't generate an answer just now — please try again in a moment.";
    sources = [];
    onToken?.(answer);
  }

  const assistantMessage = await chatRepo.createMessage({
    conversationId,
    role: 'ASSISTANT',
    content: answer,
    sources,
  });

  const conversationUpdate = { lastMessageAt: new Date() };
  if (!conversation.title) {
    conversationUpdate.title = deriveTitle(question);
    conversationUpdate.isGeneratedTitle = true;
  }
  await chatRepo.updateConversation(conversationId, conversationUpdate);

  return { assistantMessage };
}

module.exports = {
  listConversations,
  createConversation,
  getMessages,
  assertConversationAccessible,
  streamMessage,
};
