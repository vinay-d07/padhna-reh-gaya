const prisma = require('../../lib/prisma');

async function createDocument(data) {
  return await prisma.document.create({ data });
}

async function findDocumentsByWorkspaceId(workspaceId) {
  return await prisma.document.findMany({
    where: { workspaceId, deletedAt: { isSet: false } },
    orderBy: { createdAt: 'desc' },
  });
}

async function findDocumentById(id) {
  return await prisma.document.findFirst({
    where: { id, deletedAt: { isSet: false } },
  });
}

async function softDeleteDocument(id) {
  return await prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

module.exports = {
  createDocument,
  findDocumentsByWorkspaceId,
  findDocumentById,
  softDeleteDocument,
};
