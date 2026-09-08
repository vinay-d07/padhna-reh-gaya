const notesRepo = require('./repo');
const workspaceRepo = require('../workspaces/repo');
const userRepo = require('../users/repo');

// content is stored as Json but is currently always an HTML string from the
// Tiptap editor; plainText/wordCount are derived from it for display/search.
function deriveTextStats(content) {
  const raw = typeof content === 'string' ? content : JSON.stringify(content ?? '');
  const plainText = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(' ').length : 0;
  return { plainText, wordCount };
}

async function createNote({ workspaceId, clerkId, title, content }) {
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

  const noteContent = content ?? '';
  const { plainText, wordCount } = deriveTextStats(noteContent);

  return await notesRepo.createNote({
    workspaceId,
    userId: user.id,
    title: title?.trim() || 'Untitled note',
    content: noteContent,
    plainText,
    wordCount,
  });
}

async function listNotes(workspaceId) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }

  const workspace = await workspaceRepo.findWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  return await notesRepo.findNotesByWorkspaceId(workspaceId);
}

async function updateNote(id, data) {
  if (!id) {
    throw new Error('note id is required');
  }

  const existing = await notesRepo.findNoteById(id);
  if (!existing) {
    throw new Error('Note not found');
  }

  const { title, content } = data;
  const updateData = {};

  if (title !== undefined) {
    if (!title.trim()) {
      throw new Error('title cannot be empty');
    }
    updateData.title = title.trim();
  }

  if (content !== undefined) {
    updateData.content = content;
    const { plainText, wordCount } = deriveTextStats(content);
    updateData.plainText = plainText;
    updateData.wordCount = wordCount;
  }

  return await notesRepo.updateNote(id, updateData);
}

async function deleteNote(id) {
  if (!id) {
    throw new Error('note id is required');
  }

  const existing = await notesRepo.findNoteById(id);
  if (!existing) {
    throw new Error('Note not found');
  }

  return await notesRepo.softDeleteNote(id);
}

async function restoreNote(id) {
  if (!id) {
    throw new Error('note id is required');
  }

  const existing = await notesRepo.findNoteByIdIncludingDeleted(id);
  if (!existing) {
    throw new Error('Note not found');
  }
  if (!existing.deletedAt) {
    return existing;
  }

  return await notesRepo.restoreNote(id);
}

module.exports = {
  createNote,
  listNotes,
  updateNote,
  deleteNote,
  restoreNote,
};
