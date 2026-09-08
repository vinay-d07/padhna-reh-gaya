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

// Deliberately does NOT filter out soft-deleted notes — used to look one up
// specifically in order to restore it.
async function findNoteByIdIncludingDeleted(id) {
  return await prisma.note.findUnique({ where: { id } });
}

async function restoreNote(id) {
  // `unset` (not `deletedAt: null`) so the field goes back to being absent —
  // matching the `isSet: false` filter every list/find query uses.
  return await prisma.note.update({
    where: { id },
    data: { deletedAt: { unset: true } },
  });
}

module.exports = {
  createNote,
  findNotesByWorkspaceId,
  findNoteById,
  updateNote,
  softDeleteNote,
  findNoteByIdIncludingDeleted,
  restoreNote,
};
