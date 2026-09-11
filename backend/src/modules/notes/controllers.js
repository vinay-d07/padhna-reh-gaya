const noteService = require('./services');
const asyncHandler = require('../../lib/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { title, content, conversationId } = req.body;
  const note = await noteService.createNote({
    workspaceId,
    clerkId: req.clerkId,
    title,
    content,
    conversationId,
  });
  return res.status(201).json({
    success: true,
    message: 'Note created successfully',
    data: note,
  });
});

const list = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const notes = await noteService.listNotes(workspaceId);
  return res.status(200).json({
    success: true,
    data: notes,
  });
});

const update = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const note = await noteService.updateNote(noteId, req.body);
  return res.status(200).json({
    success: true,
    message: 'Note updated successfully',
    data: note,
  });
});

const remove = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  await noteService.deleteNote(noteId);
  return res.status(200).json({
    success: true,
    message: 'Note deleted successfully',
  });
});

const restore = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const note = await noteService.restoreNote(noteId);
  return res.status(200).json({
    success: true,
    message: 'Note restored successfully',
    data: note,
  });
});

const countByConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const count = await noteService.countNotesByConversationId(conversationId);
  return res.status(200).json({
    success: true,
    data: { count },
  });
});

module.exports = {
  create,
  list,
  update,
  remove,
  restore,
  countByConversation,
};
