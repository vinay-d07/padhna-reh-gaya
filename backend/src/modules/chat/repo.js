const prisma = require('../../lib/prisma');

async function createConversation(data) {
  return await prisma.conversation.create({ data });
}

async function findConversationsByWorkspaceId(workspaceId) {
  return await prisma.conversation.findMany({
    where: { workspaceId, deletedAt: { isSet: false } },
    orderBy: { updatedAt: 'desc' },
  });
}

async function findConversationById(id) {
  return await prisma.conversation.findFirst({
    where: { id, deletedAt: { isSet: false } },
  });
}

async function updateConversation(id, data) {
  return await prisma.conversation.update({ where: { id }, data });
}

async function createMessage(data) {
  return await prisma.message.create({ data });
}

async function findMessagesByConversationId(conversationId) {
  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
}

module.exports = {
  createConversation,
  findConversationsByWorkspaceId,
  findConversationById,
  updateConversation,
  createMessage,
  findMessagesByConversationId,
};
