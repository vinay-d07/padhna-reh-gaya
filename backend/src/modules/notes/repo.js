const prisma = require('../../lib/prisma');

async function createNote(data) {
  return await prisma.note.create({ data });
}

async function findNotesByWorkspaceId(workspaceId) {
  return await prisma.note.findMany({
    where: { workspaceId, deletedAt: { isSet: false } },
    orderBy: { updatedAt: 'desc' },
  });
}

async function findNoteById(id) {
  return await prisma.note.findFirst({
    where: { id, deletedAt: { isSet: false } },
  });
}

async function updateNote(id, data) {
  return await prisma.note.update({
    where: { id },
    data,
  });
}

async function softDeleteNote(id) {
  return await prisma.note.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

module.exports = {
  createNote,
  findNotesByWorkspaceId,
  findNoteById,
  updateNote,
  softDeleteNote,
};
