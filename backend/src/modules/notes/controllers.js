const noteService = require('./services');
const asyncHandler = require('../../lib/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { title, content } = req.body;
  const note = await noteService.createNote({ workspaceId, clerkId: req.clerkId, title, content });
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

module.exports = {
  create,
  list,
  update,
  remove,
};
